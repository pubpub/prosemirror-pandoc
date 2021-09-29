import { RawBlock, RawInline } from "types";
import { getQuoteChar } from "../util";

// A transformer that converts between Pandoc elements with string content and Prosemirror
// elements that accept {type: 'text', text: string}[] as their content.
export const textTransformer = (pdNodeName: "Str", pmNodeName: string) => {
    return {
        toProsemirrorNode: (node) => {
            return {
                type: pmNodeName,
                text: node.content,
            };
        },
        fromProsemirrorNode: (node) => {
            return {
                type: pdNodeName,
                content: node.content.join(""),
            };
        },
    };
};

// A one-way transformer that ignores a Pandoc node and passes its content through.
export const pandocPassThroughTransformer = (node, { transform }) => {
    return transform(node.content).asArray();
};

// A one-way transformer that converts Pandoc's Quoted inline elements to quoted text.
export const pandocQuotedTransformer = (
    node,
    { transform, useSmartQuotes }
) => {
    const isSingleQuote = node.quoteType === "SingleQuote";
    return [
        {
            type: "text",
            text: getQuoteChar(isSingleQuote, true, useSmartQuotes),
        },
        ...transform(node.content).asArray(),
        {
            type: "text",
            text: getQuoteChar(isSingleQuote, false, useSmartQuotes),
        },
    ];
};

// A transformer that returns an empty array
export const nullTransformer = () => [];

// A transformer that turns a Pandoc RawBlock or RawInline into a paragraph
export const pandocRawTransformer = (
    pmInlineNodeName: string,
    pmBlockNodeName: string = null
) => {
    return (node: RawBlock | RawInline) => {
        const { content } = node;
        const textNode = { type: pmInlineNodeName, text: content };
        if (pmBlockNodeName) {
            const blockNode = { type: pmBlockNodeName, content: [textNode] };
            return blockNode;
        }
        return textNode;
    };
};
