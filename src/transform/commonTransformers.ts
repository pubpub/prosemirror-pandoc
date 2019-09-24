import {
    Block,
    DefinitionList,
    Para,
    Plain,
    Table,
    ProsemirrorNode,
    Alignment,
} from "../types";
import { flatten } from "./util";

/*
 * A transformer appropriate for simple container nodes. Typically, these  are
 * correspondences between Pandoc elements with a content property and
 * Prosemirror elements with a children property
 */
export const contentTransformer = (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: (node, { transform }) => {
            return {
                type: pmNodeName,
                children: transform(node.content),
            };
        },
        fromProsemirror: (node, { transform }) => {
            return {
                type: pdNodeName,
                content: transform(node.children),
            };
        },
    };
};

/*
 * A transformer that converts between Pandoc elements with string content and Prosemirror
 * elements that accept {type: 'text', text: string}[] as their children.
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
                content: node.children.join(""),
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
            const children = node.content.map(blocks => {
                return processListItem({
                    type: pmInnerNodeName,
                    children: transform(blocks).asArray(),
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
                children,
            };
        },
        fromProsemirror: (node, { transform }) => {
            const content = node.children.map(listItem =>
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
    const children = node.entries.map(value => {
        const { term, definitions } = value;
        const blocks = flatten(definitions);
        const firstBlock = blocks[0];
        let prependableBlock: Para | Plain;
        if (
            firstBlock &&
            (firstBlock.type === "Para" || firstBlock.type === "Plain")
        ) {
            prependableBlock = firstBlock as (Para | Plain);
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
            children: transform(blocks).asArray(),
        };
    });
    return {
        type: pmOuterNodeName,
        children,
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
 * A one-way transformer that ignores a Pandoc node and passes its children through.
 */
export const pandocPassThroughTransformer = (node, { transform }) => {
    return transform(node.content).asArray();
};

/**
 * A transformer that returns an empty array
 */
export const nullTransformer = () => [];

/**
 * A transformer that handles tables as specified by the popular prosemirror-tables package.
 */
export const tableTransformer = {
    assertProsemirrorHandlerFor: [
        "table",
        "table_row",
        "table_header",
        "table_cell",
    ],
    fromPandoc: (node: Table, { transform }) => {
        const { headers, cells, caption } = node;
        const pmHeaderNode = {
            type: "table_row",
            children: headers.map(pdHeaderBlocks => {
                return {
                    type: "table_header",
                    children: transform(pdHeaderBlocks).asArray(),
                };
            }),
        };
        const pmRowNodes = cells.map(row => {
            return {
                type: "table_row",
                children: row.map(cellBlock => {
                    return {
                        type: "table_cell",
                        children: transform(cellBlock).asArray(),
                    };
                }),
            };
        });
        const table = {
            type: "table",
            children: [pmHeaderNode, ...pmRowNodes],
        };
        if (caption.length > 0) {
            return [
                table,
                { type: "paragraph", children: transform(caption).asArray() },
            ];
        }
        return table;
    },
    fromProsemirror: (node: ProsemirrorNode, { transform }): Table => {
        const blocks: Block[][][] = node.children.map(row => {
            return row.children.map(cell =>
                transform(cell.children).asPandocBlock()
            );
        });
        const [headers, ...cells] = blocks;
        const columnWidths = headers.map(() => 0);
        const alignments: Alignment[] = headers.map(() => "AlignDefault");
        return {
            type: "Table",
            headers,
            cells,
            columnWidths,
            alignments,
            caption: [],
        };
    },
};
