import {children, h, isComponentFn, name, ok} from "@virtualstate/focus";
import {Range} from "../range";

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

