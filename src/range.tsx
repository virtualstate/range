import {
    getChildrenFromRawNode,
    ok,
    name,
    h,
    properties,
    isUnknownJSXNode,
    possiblePropertiesKeys, raw
} from "@virtualstate/focus";
import {isArray, isAsyncIterable, isPromise} from "./is";
import {union} from "@virtualstate/union";
import {findAsyncOptions, generateOptions} from "./async-options";
import internal from "stream";

const unknownPropertyKeys: readonly unknown[] = possiblePropertiesKeys;

export async function *Range(options?: Record<string | symbol, unknown>, input?: unknown): AsyncIterable<unknown> {
    const array = getChildrenFromRawNode(input);
    ok(isArray(array), "Expected an array");
    ok(array.length > 0);

    const ranges = array.filter(isRange);
    const others = ranges.length ? (
        array.filter(value => !ranges.includes(value))
    ) : array;
    const mapped = ranges.map(range => {
        const children = getChildrenFromRawNode(range);
        const defaults = properties(range);
        ok(isArray(children));
        return <Range {...defaults} {...options}>{...children}</Range>;
    });
    if (!others.length && mapped.length) {
        return yield mapped;
    }

    ok(!mapped.length, "Use range or values, not both");

    const [asyncKeys, hasAsyncKeys] = findAsyncOptions(options)

    if (!hasAsyncKeys) {
        return yield * getMatch(options);
    }

    for await (const snapshotOptions of generateOptions(options, asyncKeys)) {
        yield * getMatch(snapshotOptions);
    }

    function isRange(node: unknown): boolean {
        return name(node) === Range.name;
    }

    function replaceMatch(match: unknown, options: Record<string, unknown>) {
        ok(isUnknownJSXNode(match));
        const snapshotOptions = {
            ...properties(match),
            ...options
        }
        const node = raw(match);
        return {
            ...Object.fromEntries(
                Object.entries(node)
                    .filter(([key]) => !unknownPropertyKeys.includes(key))
            ),
            options: snapshotOptions
        }
    }

    function * getMatch(options: Record<string, unknown>) {
        const match = others.find(node => isMatch(node, options));
        if (match) {
            yield replaceMatch(match, options);
        } else {
            yield * getDefaultMatch(options);
        }
    }

    function * getDefaultMatch(options: Record<string, unknown>): Iterable<unknown> {
        const node = others.at(-1);
        ok(typeof node !== "undefined");
        const validators = Object.values(
            properties(node)
        )
            .filter(isMatchValidator);
        if (validators.length) return undefined;
        yield replaceMatch(node, options);
    }

    interface MatchValidatorFn {
        (arg: unknown): unknown
    }

    function isMatchValidator(value: unknown): value is MatchValidatorFn {
        return typeof value === "function";
    }

    function isMatchValidatorEntry(value: [string, unknown]): value is [string, MatchValidatorFn] {
        return isMatchValidator(value[1]);
    }

    function isMatch(node: unknown, options: Record<string, unknown>) {
        const expected = Object.entries(
            properties(node)
        );
        if (expected.length === 0) {
            const keys = Object.keys(options);
            return keys.length === 0;
        }
        const validators = expected.filter(isMatchValidatorEntry);
        if (validators.length) {
            for (const [key, validator] of validators) {
                const found = options[key];
                if (!validator(found)) {
                    return false;
                }
            }
        } else {
            for (const [key, value] of expected) {
                const found = options[key];
                if (found !== value) {
                    return false;
                }
            }
        }
        return true;
    }
}