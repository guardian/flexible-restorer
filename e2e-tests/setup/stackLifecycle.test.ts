import { setImmediate } from "node:timers/promises";
import { describe, expect, it, vi } from "vitest";
import { settleAll, createStackResources, type StackReporter } from "./stackLifecycle";

function deferred<Result>() {
    let resolve!: (value: Result) => void;
    const promise = new Promise<Result>((complete) => { resolve = complete; });
    return { promise, resolve };
}

function reporter(): StackReporter {
    return {
        step: async (_name, action) => action(),
        log: () => { },
    };
}

describe("stack lifecycle", () => {
    it("waits for a pending container to start, cleans it up, and preserves the original startup error", async () => {
        const resources = createStackResources(reporter());
        const lateStart = deferred<{ stop: ReturnType<typeof vi.fn> }>();
        const stopContainer = vi.fn().mockResolvedValue(undefined);
        const stopNetwork = vi.fn().mockResolvedValue(undefined);
        const failure = new Error("build failed");
        await resources.startNetwork(async () => ({ stop: stopNetwork }));

        const stage = settleAll([
            async () => { throw failure; },
            () => resources.startContainer("late", () => lateStart.promise),
        ]).catch(async (error) => {
            await resources.stopAll();
            return error;
        });

        await setImmediate();

        expect(stopNetwork).not.toHaveBeenCalled();

        lateStart.resolve({ stop: stopContainer });

        expect(await stage).toBe(failure);
        expect(stopContainer).toHaveBeenCalledOnce();
        expect(stopNetwork).toHaveBeenCalledOnce();
    });

    it("attempts all container stops in parallel and removes the network last, even if a stop fails", async () => {
        const events: string[] = [];
        const pendingStop = deferred<void>();
        const resources = createStackResources(reporter());

        await resources.startNetwork(async () => ({
            stop: async () => { events.push("network"); },
        }));
        await resources.startContainer("broken", async () => ({
            stop: async () => { events.push("broken"); throw new Error("stop failed"); },
        }));
        await resources.startContainer("slow", async () => ({
            stop: async () => { events.push("slow"); await pendingStop.promise; },
        }));

        const cleanup = resources.stopAll();

        expect(events).toHaveLength(2);
        expect(events).toEqual(expect.arrayContaining(["broken", "slow"]));

        pendingStop.resolve();

        expect(await cleanup).toBe(1);
        expect(events[2]).toBe("network");
        expect(await resources.stopAll()).toBe(1);
        expect(events).toHaveLength(3);
    });
});