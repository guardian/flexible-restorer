export type StackReporter = {
    step<Result>(name: string, action: () => Promise<Result>): Promise<Result>;
    log(message: string): void;
};

type Stoppable = { stop(): Promise<unknown> };

export async function settleAll<Results extends unknown[]>(
    actions: { [Index in keyof Results]: () => Promise<Results[Index]> },
): Promise<Results> {
    let failed = false;
    let firstError: unknown;
    const results = await Promise.allSettled(
        actions.map(async (action) => {
            try {
                return await action();
            } catch (error) {
                if (!failed) {
                    failed = true;
                    firstError = error;
                }
                throw error;
            }
        }),
    );

    if (failed) {
        throw firstError;
    }

    return results.map((result) => {
        if (result.status === "rejected") {
            throw result.reason;
        }

        return result.value;
    }) as Results;
}

export type StackResources = ReturnType<typeof createStackResources>;

export function createStackResources(reporter: StackReporter) {
    const containers = new Map<string, Stoppable>();
    let network: Stoppable | undefined;
    let cleanup: Promise<void> | undefined;

    async function startNetwork<Resource extends Stoppable>(
        action: () => Promise<Resource>,
    ): Promise<Resource> {
        return reporter.step("create:network", async () => {
            const startedNetwork = await action();
            network = startedNetwork;
            return startedNetwork;
        });
    }

    async function startContainer<Resource extends Stoppable>(
        name: string,
        action: () => Promise<Resource>,
    ): Promise<Resource> {
        return reporter.step(`start:${name}`, async () => {
            const container = await action();
            containers.set(name, container);
            return container;
        });
    }

    function stopAll(): Promise<void> {
        return cleanup ??= stopOwnedResources();
    }

    async function stopOwnedResources(): Promise<void> {
        reporter.log("cleanup START");
        const results = await Promise.allSettled(
            Array.from(containers, ([name, container]) =>
                reporter.step(`stop:${name}`, () => container.stop()),
            ),
        );

        if (network) {
            results.push(...await Promise.allSettled([
                reporter.step("remove:network", () => network!.stop()),
            ]));
        }

        const failures = results.filter((result) => result.status === "rejected");
        reporter.log(`cleanup END failures=${failures.length}`);
    }

    return { startNetwork, startContainer, stopAll };
}