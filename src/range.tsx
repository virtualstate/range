import {getChildrenFromRawNode, ok, name, h, properties} from "@virtualstate/focus";
import {isArray} from "./is";

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
        return h(Range, { ...defaults, ...options }, ...children);
    });
    if (!others.length && mapped.length) {
        return yield mapped;
    }

    ok(!mapped.length, "Use range or values, not both");
    const match = others.find(node => {
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
    });
    if (match) {
        return yield match;
    }
    yield others.at(-1);

    function isRange(node: unknown): boolean {
        return name(node) === Range.name;
    }
}