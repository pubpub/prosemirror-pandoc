import { TransformContext } from "transform/types";
import { PandocNode, ProsemirrorElement, ProsemirrorMark } from "types";


export const createWrapperNodeFromMarks = (
    innerNode: PandocNode,
    marks: ProsemirrorMark[],
    context: TransformContext<ProsemirrorElement, PandocNode>
): PandocNode | PandocNode[] => {
    return marks.reduce((node, mark) => {
        return context.transform(mark)
    }
};

export const splitNodesByMarks = (
    nodes: ProsemirrorNode[]
): { nodes: ProsemirrorNode[]; marks: ProsemirrorMark[] }[] => {};
