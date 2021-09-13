import {
    DefinitionList,
    Block,
    Para,
    Plain,
    OrderedList,
    BulletList,
} from "types";

import { flatten } from "../util";

type SimpleList = OrderedList | BulletList;

// Returns a transformer appropriate for converting between Pandoc OrderedLists and BulletLists and
// the equivalent types in a Prosemirror schema -- basically, anything like an <ol> or a <ul>.
export const createListTransformer =
    (pmInnerNodeType: string, processListItem: <N>(n: N) => N = (x) => x) =>
    (pdNodeType: SimpleList["type"], pmNodeType) => {
        return {
            toProsemirrorNode: (node, { transform }) => {
                const content = node.content.map((blocks) => {
                    return processListItem({
                        type: pmInnerNodeType,
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
                    type: pmNodeType,
                    attrs,
                    content,
                };
            },
            fromProsemirrorNode: (node, { transform }): SimpleList => {
                const content = node.content.map((listItem) =>
                    transform(listItem).asArray()
                );
                if (pdNodeType === "OrderedList") {
                    return {
                        type: pdNodeType,
                        content,
                        listAttributes: {
                            startNumber: node.attrs.order,
                            listNumberStyle: "DefaultStyle",
                            listNumberDelim: "DefaultDelim",
                        },
                    };
                }
                return {
                    type: pdNodeType,
                    content,
                };
            },
            assertCapturedProsemirrorNodes: [pmInnerNodeType],
        };
    };

// A one-way transformer that takes the cursed DefinitionList and turns it into an unordered list.
export const definitionListTransformer =
    (pmOuterNodeType, pmInnerNodeType) =>
    (node: DefinitionList, { transform }) => {
        const content = node.entries.map((value) => {
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
                type: pmInnerNodeType,
                content: transform(blocks).asArray(),
            };
        });
        return {
            type: pmOuterNodeType,
            content,
        };
    };
