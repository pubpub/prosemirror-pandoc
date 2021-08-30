import { PandocNode, ProsemirrorMark } from "types";

export const createWrapperNodeFromMarks = (
    node: PandocNode,
    marks: ProsemirrorMark[]
): PandocNode | PandocNode[] => {};

export const splitNodesByMarks = (
    nodes: ProsemirrorNode[]
): { nodes: ProsemirrorNode[]; marks: ProsemirrorMark[] }[] => {
    
};
