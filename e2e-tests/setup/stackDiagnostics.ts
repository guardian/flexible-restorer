import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import type { Readable } from "node:stream";
import { inspect, stripVTControlCharacters } from "node:util";

const OWNER_READ_WRITE = 0o600;
const OWNER_READ_WRITE_EXECUTE = 0o700;

export type StackDiagnostics = ReturnType<typeof createStackDiagnostics>;

export function formatDuration(seconds: number): string {
    if (seconds < 60) {
        return `${seconds.toFixed(1)}s`;
    }
    return `${Math.floor(seconds / 60)}m ${Math.floor(seconds % 60)}s`;
}

export function createStackDiagnostics(
    projectRoot: string,
    options: { runId?: string; debug?: boolean } = {},
) {
    const runId = options.runId ?? process.env.E2E_RUN_ID ?? randomUUID();
    const sensitiveValues = new Set(Object.entries(process.env)
        .filter(([name]) => /TOKEN|SECRET|PASSWORD|PRIVATE_KEY/i.test(name))
        .map(([, value]) => value ?? "")
        .filter(Boolean));
    const flushers = new Set<() => void>();
    const reportedErrors = new Set<unknown>();
    let writeFailed = false;

    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(runId)) {
        throw new Error("E2E_RUN_ID must contain only letters, numbers, dots, underscores and hyphens");
    }

    const directory = path.join(projectRoot, "e2e-tests/artifacts", runId);

    function redact(text: string): string {
        let redacted = stripVTControlCharacters(text)
            .replace(/((?:set-cookie|cookie|authorization)\s*:\s*)[^\r\n]+/gi, "$1[REDACTED]")
            .replace(/(gutoolsAuth-assym=)[^;\s]+/g, "$1[REDACTED]");

        for (const secret of sensitiveValues) {
            redacted = redacted.split(secret).join("[REDACTED]");
        }

        return redacted;
    }

    function append(file: string, text: string): void {
        try {
            fs.mkdirSync(path.dirname(file), { recursive: true, mode: OWNER_READ_WRITE_EXECUTE });
            fs.appendFileSync(file, text, { mode: OWNER_READ_WRITE });
        } catch (error) {
            if (!writeFailed) {
                writeFailed = true;
                console.error(redact(`Failed to save stack diagnostics: ${inspect(error)}`));
            }
        }
    }

    function log(message: string): void {
        const entry = redact(message);

        append(path.join(directory, "stack.log"), `${entry}\n`);
        console.log(entry);
    }

    async function step<Result>(name: string, action: () => Promise<Result>): Promise<Result> {
        const started = performance.now();
        const label = name.padEnd(24);

        log(`${label} STARTED`);

        try {
            const result = await action();
            const duration = ((performance.now() - started) / 1000).toFixed(1);

            log(`${label} ${"DONE".padEnd(7)} [${formatDuration(Number(duration))}]`);

            return result;
        } catch (error) {
            const duration = ((performance.now() - started) / 1000).toFixed(1);
            const details = reportedErrors.has(error) ? "" : `\n${inspect(error, { depth: 5 })}`;

            reportedErrors.add(error);
            log(`${label} ${"FAILED".padEnd(7)} [${formatDuration(Number(duration))}]${details}`);
            throw error;
        }
    }

    function capture(category: "builds" | "containers", name: string, stream: Readable): void {
        const file = path.join(directory, category, `${name}.log`);

        append(file, `\n${new Date().toISOString()} ${name} log attached\n`);

        if (stream.readableEncoding !== "utf8") {
            stream.setEncoding("utf8");
        }

        let pending = "";
        const write = (line: string) => {
            const safeLine = redact(line);
            append(file, `${safeLine}\n`);
            if (options.debug ?? process.env.E2E_DEBUG === "1") {
                process.stdout.write(`[${name}] ${safeLine}\n`);
            }
        };
        const consume = (chunk: string) => {
            pending += chunk;
            const lines = pending.split("\n");
            pending = lines.pop() ?? "";
            for (const line of lines) {
                write(line);
            }
        };
        const flush = () => {
            if (pending) {
                write(pending);
                pending = "";
            }
        };
        const finish = () => {
            flush();
            flushers.delete(flush);
        };

        flushers.add(flush);
        stream.on("data", consume);
        stream.once("end", finish);
        stream.once("close", finish);
        stream.on("error", (error) => log(`logs:${name} FAILED ${inspect(error)}`));
    }

    function flush(): void {
        for (const flush of flushers) {
            flush();
        }
    }

    fs.mkdirSync(directory, { recursive: true, mode: OWNER_READ_WRITE_EXECUTE });
    log(`diagnostics: ${directory}`);

    return { runId, directory, log, step, capture, flush } as const;
}