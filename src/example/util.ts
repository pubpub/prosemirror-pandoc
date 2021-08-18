import { Inline, Doc, Plain, Para, Block } from "../types";
import { callPandoc } from "../util";
import { emitPandocJson } from "../emit";
import { parsePandocJson } from "../parse";
import { flatten } from "../transform/util";

const getHtmlStringForPandocDoc = (document: Doc): string =>
    callPandoc(JSON.stringify(emitPandocJson(document)), "json", "html");

const getPandocDocForHtmlString = (htmlString: string): Doc =>
    parsePandocJson(JSON.parse(callPandoc(htmlString, "html", "json")));

export const pandocInlineToHtmlString = (nodes: Inline[]) => {
    if (nodes.length === 0) {
        return "";
    }
    const document: Doc = {
        type: "Doc",
        blocks: [{ type: "Para", content: nodes }],
        meta: {},
    };
    return getHtmlStringForPandocDoc(document);
};

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
    if (htmlString.length === 0) {
        return [];
    }
    const pandocAst = getPandocDocForHtmlString(htmlString);
    return flatten(
        (pandocAst.blocks.filter(
            block => block.type === "Plain" || block.type === "Para"
        ) as (Plain | Para)[]).map(block => block.content)
    );
};

export const htmlStringToPandocBlocks = (htmlString: string): Block[] => {
    if (htmlString.length === 0) {
        return [];
    }
    const pandocAst = getPandocDocForHtmlString(htmlString);
    return pandocAst.blocks;
};
