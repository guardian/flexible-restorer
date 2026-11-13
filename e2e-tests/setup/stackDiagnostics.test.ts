import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PassThrough } from "node:stream";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createStackDiagnostics } from "./stackDiagnostics";

const directories: string[] = [];

function createDiagnostics() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "restorer-diagnostics-"));

    directories.push(root);
    vi.spyOn(console, "log").mockImplementation(() => { });

    return createStackDiagnostics(root, { runId: "test-run", debug: false });
}

afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();

    for (const directory of directories.splice(0)) {
        fs.rmSync(directory, { recursive: true, force: true });
    }
});

describe("stack diagnostics", () => {
    it("saves propagated failure details once and preserves the original error", async () => {
        const diagnostics = createDiagnostics();
        const failure = new Error("readiness failed");

        await expect(diagnostics.step("startup", () =>
            diagnostics.step("start:app", async () => { throw failure; }),
        )).rejects.toBe(failure);

        const output = fs.readFileSync(path.join(diagnostics.directory, "stack.log"), "utf8");

        expect(output).toMatch(/start:app\s+FAILED/);
        expect(output).toMatch(/startup\s+FAILED/);
        expect(output.match(/Error: readiness failed/g)).toHaveLength(1);
    });

    it("redacts secrets split across saved log chunks", () => {
        vi.stubEnv("E2E_TEST_SECRET", "test-secret");
        const diagnostics = createDiagnostics();
        const stream = new PassThrough();

        diagnostics.capture("containers", "app", stream);
        stream.write("\u001b[31mtoken=test-");
        stream.write("secret\u001b[0m\nSet-Cookie: gutoolsAuth-assym=secret-cookie; Path=/\n");

        const utf8Line = Buffer.from("caf\u00e9\n");

        stream.write(utf8Line.subarray(0, 4));
        stream.write(utf8Line.subarray(4));
        stream.write("last line");
        diagnostics.flush();

        const output = fs.readFileSync(path.join(diagnostics.directory, "containers/app.log"), "utf8");

        expect(output).toContain("token=[REDACTED]");
        expect(output).toContain("caf\u00e9");
        expect(output).toContain("last line");
        expect(output).not.toMatch(/test-secret|secret-cookie/);
        expect(output).not.toContain("\u001b");

        stream.destroy();
    });
});