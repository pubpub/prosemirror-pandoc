import {
    Block,
    DefinitionList,
    Para,
    Plain,
    ProsemirrorNode,
    Doc,
    RawBlock,
    RawInline,
} from "../../types";
import { flatten, getQuoteChar } from "../util";

/*
 * A transformer that turns Pandoc root-level documents into Prosemirror ones.
 */
export const docTransformer = (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: (node: Doc, { transform }): ProsemirrorNode => {
            const { blocks } = node;
            return {
                type: pmNodeName,
                content: transform(blocks).asArray(),
            };
        },
        fromProsemirror: (node: ProsemirrorNode, { transform }): Doc => {
            const { content } = node;
            return {
                type: pdNodeName,
                blocks: transform(content).asArray(),
                meta: {},
            };
        },
    };
};

/*
 * A transformer appropriate for simple container nodes. Typically, these  are
 * correspondences between Pandoc elements with a content property and
 * Prosemirror elements with a content property
 */
export const contentTransformer = (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: (node, { transform }) => {
            return {
                type: pmNodeName,
                content: transform(node.content),
            };
        },
        fromProsemirror: (node, { transform }) => {
            return {
                type: pdNodeName,
                content: transform(node.content),
            };
        },
    };
};

/*
 * A transformer that converts between Pandoc elements with string content and Prosemirror
 * elements that accept {type: 'text', text: string}[] as their content.
 */
export const textTransformer = (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: node => {
            return {
                type: pmNodeName,
                text: node.content,
            };
        },
        fromProsemirror: node => {
            return {
                type: pdNodeName,
                content: node.content.join(""),
            };
        },
    };
};

/*
 * A transformer appropriate for converting between Pandoc OrderedLists and BulletLists and the
 * equivalent types in a Prosemirror schema -- basically, anything like an <ol> or a <ul>.
 */
export const listTransformer = (
    pmInnerNodeName: string,
    processListItem: <N>(n: N) => N = x => x
) => (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: (node, { transform }) => {
            const content = node.content.map(blocks => {
                return processListItem({
                    type: pmInnerNodeName,
                    content: transform(blocks).asArray(),
                });
            });
            const hasOrder =
                node.listAttributes &&
                typeof node.listAttributes.startNumber === "number";
            const attrs = hasOrder
                ? { order: node.listAttributes.startNumber }
                : {};
            return {
                type: pmNodeName,
                attrs,
                content,
            };
        },
        fromProsemirror: (node, { transform }) => {
            const content = node.content.map(listItem =>
                transform(listItem).asArray()
            );
            const additionalAttributes =
                typeof node.attrs.order === "number"
                    ? {
                          listAttributes: {
                              startNumber: node.attrs.order,
                              listNumberStyle: "DefaultStyle",
                              listNumberDelim: "DefaultDelim",
                          },
                      }
                    : {};
            return {
                type: pdNodeName,
                content,
                ...additionalAttributes,
            };
        },
    };
};

/**
 * A one-way transformer that takes the cursed DefinitionList and turns it into an unordered list.
 */
export const definitionListTransformer = (pmOuterNodeName, pmInnerNodeName) => (
    node: DefinitionList,
    { transform }
) => {
    const content = node.entries.map(value => {
        const { term, definitions } = value;
        const blocks = flatten<Block>(definitions);
        const firstBlock = blocks[0];
        let prependableBlock: Para | Plain;
        if (
            firstBlock &&
            (firstBlock.type === "Para" || firstBlock.type === "Plain")
        ) {
            prependableBlock = firstBlock as Para | Plain;
        } else {
            prependableBlock = { type: "Para", content: [] };
            blocks.unshift(prependableBlock);
        }
        prependableBlock.content.unshift({
            type: "Strong",
            content: [
                ...term,
                { type: "Str", content: ":" },
                { type: "Space" },
            ],
        });
        return {
            type: pmInnerNodeName,
            content: transform(blocks).asArray(),
        };
    });
    return {
        type: pmOuterNodeName,
        content,
    };
};

/**
 * A transformer that does type -> type conversion for simple leaf nodes
 */
export const bareLeafTransformer = (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: () => {
            return {
                type: pmNodeName,
            };
        },
        fromProsemirror: () => {
            return {
                type: pdNodeName,
            };
        },
    };
};

/**
 * A one-way transformer that ignores a Pandoc node and passes its content through.
 */
export const pandocPassThroughTransformer = (node, { transform }) => {
    return transform(node.content).asArray();
};

/**
 * A one-way transformer that converts Pandoc's Quoted inline elements to quoted text.
 */
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

/**
 * A transformer that returns an empty array
 */
export const nullTransformer = () => [];

/*
 * A transformer that turns a Pandoc RawBlock or RawInline into a paragraph
 */
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
