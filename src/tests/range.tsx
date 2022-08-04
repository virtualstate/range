import {children, h, isComponentFn, name, ok} from "@virtualstate/focus";
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

    ok(snapshot.length === 1);
    ok(name(snapshot[0]) === "component");
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