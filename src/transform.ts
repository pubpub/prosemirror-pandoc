import { ContentMatch } from "prosemirror-model/src/content";

import { Attr } from "./types";
// fromPandocNode("BlockQuote", (node: BlockQuote, pm: Prosemirror) => {
//     const { content } = node;
//     return pm("blockquote").parseContent(content);
// });

// toPandocNode("blockquote", (node, pandoc) => {
//     return {
//         content: "Blockquote",
//     };
// });

const parseContentExpression = (expr, schema) => {
    return ContentMatch.parse(expr, schema);
};

const standardTransformer = <PDNodeType>(
    pdNodeType,
    pmNodeType,
    transformAttrs = x => x
) => {
    const toProsemirror = (pdNode: PDNodeType) => {
        pdNodeType;
        return {
            type: pmNodeType,
            ...extractAttrs(pdNode, transformAttrs),
            ...extractContent(pmNodeType, pmNodeType, pdNode),
        };
    };
};

const extractAttrs = (node: { attr?: Attr }, transformer: (obj: {}) => {}) => {
    if (node.attr) {
        const { properties } = node.attr;
        return transformer(properties);
    }
    return null;
};

const extractContent = (
    context,
    pmNodeType,
    pdNode,
    iterateLeniently = false
) => {
    const { transform, getNodeSchema } = context;
    const schema = getNodeSchema(pmNodeType);
    let content = [];
    if (schema.atom) {
        return null;
    }
    const iterator = schema.createContentIterator(pdNode);
    while (iterator.nodesRemain()) {
        if (iterator.acceptsCurrentNode()) {
            const result = transform(iterator.takeCurrentNode());
            if (Array.isArray(result)) {
                content = [...content, ...result];
            } else {
                content.push(result);
            }
        } else {
            if (iterateLeniently) {
                iterator.skipCurrentNode();
            } else {
                break;
            }
        }
    }
    return content;
};
