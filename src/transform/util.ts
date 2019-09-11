import { Attr, Str, Space } from "../types";

export const createAttr = (...args): Attr => {
    if (args.length === 1) {
        return {
            identifier: "",
            classes: [],
            properties: args[0],
        };
    } else {
        const [identifier, classes, properties] = args;
        return { identifier, classes, properties };
    }
};

export const textFromStrSpace = (nodes: (Str | Space)[]) => {
    let text = "";
    for (const entry of nodes) {
        if (entry.type === "Str") {
            text = text + entry.content;
        } else {
            text = text + " ";
        }
    }
    return text;
};

export const intersperse = <T>(
    arr: T[],
    intersperseFn: (index?: number) => T
): T[] =>
    arr.reduce((accumulated: T[], next: T, index: number): T[] => {
        const added: T[] = [next];
        if (index !== arr.length - 1) {
            added.push(intersperseFn(index));
        }
        return [...accumulated, ...added];
    }, []);

export const textToStrSpace = (text: string): (Str | Space)[] =>
    intersperse<Str | Space>(
        text.split(" ").map(word => ({ type: "Str", content: word })),
        () => ({ type: "Space" })
    );
