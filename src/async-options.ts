import {union} from "@virtualstate/union";
import {isAsyncIterable, isPromise} from "./is";

type Options = Record<string | symbol, unknown>;
type AsyncOption = Promise<unknown> | AsyncIterable<unknown>;
/**
 * @internal
 */
export type AsyncResult = AsyncIterable<[string, unknown]>;
/**
 * @internal
 */
export type AsyncResultRecord = Record<string, AsyncResult>;

/**
 * @internal
 */
export async function *generateOptions(options: Options, asyncKeys: AsyncResultRecord): AsyncIterable<Record<string, unknown>> {
    const keys = Object.keys(asyncKeys);
    for await (const snapshot of union(Object.values(asyncKeys))) {
        const currentKeys = snapshot
            .filter(Boolean)
            .map(([key]) => key);
        const every = keys.every((key) => currentKeys.includes(key));
        if (!every) {
            continue;
        }
        const snapshotOptions = {
            ...options
        };
        for (const [key, value] of snapshot) {
            snapshotOptions[key] = value;
        }
        yield snapshotOptions;
    }
}

/**
 * @internal
 */
export function findAsyncOptions(options: Record<string, unknown>): [AsyncResultRecord, boolean] {
    const entries = Object.entries(options)
        .filter((entry): entry is [string, AsyncOption] => {
            const [,value] = entry;
            return isAsyncIterable(value) || isPromise(value)
        })
        .map(([key, value]) => [key, resolve(key, value)] as const);
    return [Object.fromEntries(entries), entries.length > 0];

    async function *resolve(key: string, value: AsyncOption): AsyncIterable<[string, unknown]> {
        if (isAsyncIterable(value)) {
            for await (const snapshot of value) {
                yield [key, snapshot];
            }
        } else {
            const snapshot = await value;
            yield [key, snapshot];
        }
    }
}