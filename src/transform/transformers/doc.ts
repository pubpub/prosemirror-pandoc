import { Doc, ProsemirrorNode } from "types";

// A transformer that turns Pandoc root-level documents into Prosemirror ones.
export const docTransformer = (pdNodeType: "Doc", pmNodeType) => {
    return {
        toProsemirrorNode: (node: Doc, { transform }): ProsemirrorNode => {
            const { blocks } = node;
            return {
                type: pmNodeType,
                content: transform(blocks).asArray(),
            };
        },
        fromProsemirrorNode: (node: ProsemirrorNode, { transform }): Doc => {
            const { content } = node;
            return {
                type: pdNodeType,
                blocks: transform(content).asArray(),
                meta: {},
            };
        },
    };
};
