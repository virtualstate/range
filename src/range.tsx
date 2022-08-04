import {getChildrenFromRawNode, ok, name, h, properties} from "@virtualstate/focus";
import {isArray, isAsyncIterable, isPromise} from "./is";
import {union} from "@virtualstate/union";
import {findAsyncOptions, generateOptions} from "./async-options";

export async function *Range(options?: Record<string | symbol, unknown>, input?: unknown): AsyncIterable<unknown> {
    const array = getChildrenFromRawNode(input);
    ok(isArray(array), "Expected an array");
    ok(array.length > 0);

    const ranges = array.filter(isRange);
    const others = ranges.length ? (
        array.filter(value => !ranges.includes(value))
    ) : array;
    if (!ranges.length && others.length === 1) {
        return yield others.at(0);
    }

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
        return yield getMatch(options);
    }

    let yielded = false;
    for await (const snapshotOptions of generateOptions(options, asyncKeys)) {
        yield getMatch(snapshotOptions);
        yielded = true;
    }

    if (!yielded) {
        yield others.at(-1);
    }

    function isRange(node: unknown): boolean {
        return name(node) === Range.name;
    }

    function getMatch(options: Record<string, unknown>) {
        const match = others.find(node => isMatch(node, options));
        if (match) {
            return match;
        } else {
            return others.at(-1);
        }
    }

    function isMatch(node: unknown, options: Record<string, unknown>) {
        const expected = Object.entries(
            properties(node)
        );
        if (expected.length === 0) {
            const keys = Object.keys(options);
            return keys.length === 0;
        }
        for (const [key, value] of expected) {
            const found = options[key];
            if (found !== value) {
                return false;
            }
        }
        return true;
    }
}