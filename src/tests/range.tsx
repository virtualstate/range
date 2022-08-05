/* c8 ignore start */
import {children, h, isComponentFn, isLike, name, ok, properties} from "@virtualstate/focus";
import {Range} from "../range";
import {Push} from "@virtualstate/promise";

async function *Component(options: Record<string, unknown>) {
    yield <component {...options} />
}

{

    const range = (
        <Range>
            <default value={-1} />
        </Range>
    );

    let snapshot = await children(range);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "default");

}
{

    const range = (
        <Range>
            <match />
            <default value={-1} />
        </Range>
    );

    let snapshot = await children(range);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "match");

}

{

    const range = (
        <Range>
            <Component value={1} />
            <match value={2} />
            <default value={-1} />
        </Range>
    );

    let snapshot = await children(range);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "default");

    const rangeOne = <Range value={1}>{range}</Range>;

    snapshot = await children(rangeOne);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "component");

    const rangeTwo = <Range value={2}>{rangeOne}</Range>;
    snapshot = await children(rangeTwo);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "match");
}

{

    const range = (
        <Range>
            <Range value={1}>
                <match value={1} />
                <Component value={2} />
            </Range>
            <Range>
                <Component value={1} />
                <match value={2} />
                <default value={-1} />
            </Range>
        </Range>
    );

    let snapshot = await children(range);

    console.log(snapshot);

    ok(snapshot.length === 2);
    ok(name(snapshot[0]) === "match");
    ok(name(snapshot[1]) === "default");

    const rangeOne = <Range value={1}>{range}</Range>;
    snapshot = await children(rangeOne);

    console.log(snapshot);

    ok(snapshot.length === 2);
    ok(name(snapshot[0]) === "match");
    ok(name(snapshot[1]) === "component");


    const rangeTwo = <Range value={2}>{rangeOne}</Range>;
    snapshot = await children(rangeTwo);

    console.log(snapshot);

    ok(snapshot.length === 2);
    ok(name(snapshot[0]) === "component");
    ok(name(snapshot[1]) === "match");
}


{
    const range = (
        <Range value={{
            async *[Symbol.asyncIterator]() {
                yield 1;
            }
        }}>
            <match value={1} />
            <Component value={2} />
        </Range>
    );
    const snapshot = await children(range);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "match");
}

{
    const target = new Push();
    const range = (
        <Range value={target}>
            <match value={1} />
            <Component value={2} />
        </Range>
    );
    target.push(1);
    target.close();

    const snapshot = await children(range);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "match");
}



{
    const target = new Push();
    const range = (
        <Range value={target}>
            <Range>
                <Range value={1}>
                    <match value={1} />
                    <Component value={2} />
                </Range>
            </Range>
        </Range>
    );
    target.push(1);
    target.push(2);
    target.push(1);
    target.close();

    const seen: string[] = [];

    for await (const snapshot of children(range)) {
        const value = name(snapshot[0])
        console.log(snapshot, value);
        ok(snapshot.length === 1);
        ok(value === "match" || value === "component");
        seen.push(value);
    }

    ok(seen.length === 3);
    ok(seen[0] === "match");
    ok(seen[1] === "component");
    ok(seen[2] === "match");

}


{
    const target = new Push();
    const range = (
        <Range value={target}>
            <match value={1} />
            <Component value={2} />
        </Range>
    );
    target.close();

    const snapshot = await children(range);

    console.log(snapshot);

    ok(snapshot.length === 0);
}

{
    const valueTarget = new Push();
    const checkedTarget = new Push();
    const range = (
        <Range value={valueTarget} checked={checkedTarget}>
            <match value checked />
            <Component value={2} />
        </Range>
    );

    valueTarget.push(true);
    valueTarget.close()

    async function run() {
        await new Promise(resolve => setTimeout(resolve, 10));
        checkedTarget.push(true);
        checkedTarget.close();
    }

    const [snapshot] = await Promise.all([
        children(range),
        run()
    ]);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "match");
}

{
    const range = (
        <Range value={Promise.resolve(1)}>
            <match value={1} />
            <Component value={2} />
        </Range>
    );
    const snapshot = await children(range);

    console.log(snapshot);

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "match");
}


{
    const range = (
        <Range type="text" value="something">
            <input type="text" />
        </Range>
    );
    const snapshot = await children(range);

    console.log(snapshot, properties(snapshot[0]));

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "input");
    ok(properties(snapshot[0]).type === "text");
    ok(properties(snapshot[0]).value === "something");
}

{

    const target = new Push();
    const range = (
        <Range type="text" value={target}>
            <input type="text" />
        </Range>
    );
    target.push("something");
    target.close();

    const snapshot = await children(range);

    console.log(snapshot, properties(snapshot[0]));

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "input");
    ok(properties(snapshot[0]).type === "text");
    ok(properties(snapshot[0]).value === "something");
}

{

    const range = (
        <Range type="text" value={Promise.resolve("something")}>
            <input type="text" />
        </Range>
    );

    const snapshot = await children(range);

    console.log(snapshot, properties(snapshot[0]));

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "input");
    ok(properties(snapshot[0]).type === "text");
    ok(properties(snapshot[0]).value === "something");
}

function isNumber(value: unknown): value is number {
    return typeof value === "number";
}

function isString(value: unknown): value is string {
    return typeof value === "string";
}

{
    const range = (
        <Range value={Promise.resolve(1)}>
            <input type="number" value={isNumber} />
            <input type="text" value={isString} />
        </Range>
    );
    const snapshot = await children(range);

    console.log(snapshot, properties(snapshot[0]));

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "input");
    ok(properties(snapshot[0]).type === "number");
    ok(properties(snapshot[0]).value === 1);
}

{
    const range = (
        <Range value={Promise.resolve(1)}>
            <input type="text" value={isString} />
        </Range>
    );
    const snapshot = await children(range);
    console.log(snapshot);
    ok(snapshot.length === 0);
    ok(!snapshot[0]);
}

{
    const range = (
        <Range value={Promise.resolve(1)}>
            <Component value={isLike} />
        </Range>
    );
    const snapshot = await children(range);
    console.log(snapshot, properties(snapshot[0]));
    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "component");
    ok(properties(snapshot[0]).value === 1);
}