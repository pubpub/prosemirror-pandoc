import { Inline, Doc, Plain, Para, Block } from "../types";
import { callPandoc } from "../util";
import { emitPandocJson } from "../emit";
import { parsePandocJson } from "../parse";
import { flatten } from "../transform/util";

export const getOutputStringForPandocDoc = (
    document: Doc,
    format: string
): string =>
    callPandoc(JSON.stringify(emitPandocJson(document)), "json", format).trim();

export const getPandocDocForInputString = (
    input: string,
    format: string
): Doc => {
    if (!input) {
        return { type: "Doc", blocks: [], meta: {} };
    }
    return parsePandocJson(JSON.parse(callPandoc(input, format, "json")));
};

export const getHtmlStringForPandocDoc = (document: Doc): string =>
    getOutputStringForPandocDoc(document, "html");

export const getPandocDocForHtmlString = (htmlString: string): Doc =>
    getPandocDocForInputString(htmlString, "html");

export const pandocBlocksToOutputString = (blocks: Block[], format: string) => {
    if (blocks.length === 0) {
        return "";
    }
    const document: Doc = {
        type: "Doc",
        blocks,
        meta: {},
    };
    return getOutputStringForPandocDoc(document, format);
};

export const pandocInlineToOutputString = (
    content: Inline[],
    format: string
) => {
    return pandocBlocksToOutputString([{ type: "Para", content }], format);
};

export const pandocInlineToHtmlString = (nodes: Inline[]) =>
    pandocInlineToOutputString(nodes, "html");

export const pandocInlineToPlainString = (nodes: Inline[]) =>
    pandocInlineToOutputString(nodes, "plain");

export const pandocBlocksToHtmlString = (blocks: Block[]) => {
    if (blocks.length === 0) {
        return "";
    }
    const document: Doc = {
        type: "Doc",
        blocks,
        meta: {},
    };
    return getHtmlStringForPandocDoc(document);
};

export const htmlStringToPandocInline = (htmlString: string): Inline[] => {
    if (!htmlString) {
        return [];
    }
    const pandocAst = getPandocDocForHtmlString(htmlString);
    return flatten(
        (
            pandocAst.blocks.filter(
                (block) => block.type === "Plain" || block.type === "Para"
            ) as (Plain | Para)[]
        ).map((block) => block.content)
    );
};

export const htmlStringToPandocBlocks = (htmlString: string): Block[] => {
    if (!htmlString) {
        return [];
    }
    const pandocAst = getPandocDocForHtmlString(htmlString);
    return pandocAst.blocks;
};
