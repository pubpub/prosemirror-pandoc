import { Attr, Str, Space } from "../types";

export const createAttr = (
    identifier: string = "",
    classes: string[] = [],
    properties: Record<string, any> = {}
): Attr => {
    return { identifier, classes, properties };
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

export const intersperse = (
    arr: any[],
    intersperseFn: (index?: number) => any
): any[] =>
    (Array.isArray(arr) ? arr : [arr]).reduce(
        (accumulated: any[], next: any, index: number): any[] => {
            const added: any[] = [next];
            if (index !== (Array.isArray(arr) ? arr : [arr]).length - 1) {
                added.push(intersperseFn(index));
            }
            return [...accumulated, ...added];
        },
        []
    );

export const textToStrSpace = (text: string): (Str | Space)[] =>
    intersperse(
        text.split(" ").map((word) => ({ type: "Str", content: word })),
        () => ({ type: "Space" })
    ).filter((node) => {
        if (node.type === "Str" && node.content.length === 0) {
            return false;
        }
        return true;
    });

export const asArray = <T>(item: T | T[]): T[] => {
    return Array.isArray(item) ? item : [item];
};

export const asNode = <T>(item: T | T[]): T => {
    return Array.isArray(item) ? item[0] : item;
};

export const flatten = <T>(input: any): T[] => {
    if (!Array.isArray(input)) {
        return [input];
    }
    return input.reduce((arr: T[], next: T | T[]) => {
        if (Array.isArray(next)) {
            return [...arr, ...flatten(next)];
        }
        return [...arr, next];
    }, [] as T[]) as T[];
};

export const getQuoteChar = (
    single: boolean,
    opening: boolean,
    smart: boolean
) => {
    if (smart) {
        if (single) {
            return opening ? "‘" : "’";
        } else {
            return opening ? "“" : "”";
        }
    } else {
        return single ? "'" : '"';
    }
};

export const makeCounter = () => {
    const countMap: Map<string, number> = new Map();
    return (type: string) => {
        const count = countMap.get(type) || 0;
        countMap.set(type, count + 1);
        return count;
    };
};
