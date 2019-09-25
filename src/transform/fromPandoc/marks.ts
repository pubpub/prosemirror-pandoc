import {
    ProsemirrorNode,
    ProsemirrorMark,
    ProsemirrorSchema,
} from "../../types";

const compareMarks = (first: ProsemirrorMark, second: ProsemirrorMark) =>
    // Tell no one what you saw here
    JSON.stringify(first) === JSON.stringify(second);

const dedupeMarks = (marks: ProsemirrorMark[]): ProsemirrorMark[] => {
    const collected: ProsemirrorMark[] = [];
    for (const mark of marks) {
        if (!collected.some(existingMark => compareMarks(existingMark, mark))) {
            collected.push(mark);
        }
    }
    return collected;
};

const nodeAcceptsMarks = (node: ProsemirrorNode, schema: ProsemirrorSchema) => {
    const definition = schema.nodes[node.type];
    if (!definition) {
        throw new Error(`No Prosemirror schema entry for node ${node.type}`);
    }
    return definition.group === "inline";
};

export const applyMarksToNodes = (
    nodes: ProsemirrorNode[],
    schema: ProsemirrorSchema,
    marksMap: Map<ProsemirrorNode, ProsemirrorMark[]>
): ProsemirrorNode[] => {
    const applyInner = (
        node: ProsemirrorNode,
        appliedMarks: ProsemirrorMark[],
        pendingMarks: ProsemirrorMark[]
    ): ProsemirrorNode => {
        const marksAtNode = marksMap.get(node) || [];
        const cumulativeMarks = dedupeMarks([...pendingMarks, ...marksAtNode]);
        const acceptMarksHere = nodeAcceptsMarks(node, schema);
        const marksProps =
            acceptMarksHere && cumulativeMarks.length > 0
                ? { marks: cumulativeMarks }
                : {};
        if (!node.content && !acceptMarksHere && marksAtNode.length > 0) {
            console.warn(
                `Dropping marks at leaf node ${node.type}. This node should probably have group="inline".`
            );
        }
        const nextAppliedMarks = [
            ...appliedMarks,
            ...(acceptMarksHere ? marksAtNode : []),
        ];
        const nextPendingMarks = acceptMarksHere ? [] : cumulativeMarks;
        const contentProps = node.content
            ? {
                  content: node.content.map(child =>
                      applyInner(child, nextAppliedMarks, nextPendingMarks)
                  ),
              }
            : {};
        return {
            ...node,
            ...marksProps,
            ...contentProps,
        };
    };

    return nodes.map(node => applyInner(node, [], []));
};
