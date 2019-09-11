import { Str, Space } from "../types";

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

export const textToStrSpace = (text: string): (Str | Space)[] => {
    const words = text.split(" ");
    return words.reduce((acc: (Str | Space)[], next: string, index: number) => {
        const addedHere: any[] = [{ type: "Str", content: next }];
        if (index !== words.length - 1) {
            addedHere.push({ type: "Space" });
        }
        return [...acc, ...addedHere];
    }, []);
};
