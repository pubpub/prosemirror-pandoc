import { flatten, asArray, compareMarks } from "./util";

import {
    PandocNode,
    ProsemirrorNode,
    ProsemirrorMark,
    ProsemirrorSchema,
} from "../types";
import { ProsemirrorFluent, prosemirrorFluent } from "./fluent";
import {
    TransformContext,
    RuleSet,
    getTransformRuleForElements,
} from "./transformer";

const matchPandocNode = (identifier: string) => (node: PandocNode): boolean => {
    return identifier === node.type;
};

const nodeAcceptsMarks = (node: ProsemirrorNode, schema: ProsemirrorSchema) => {
    const definition = schema.nodes[node.type];
    if (!definition) {
        throw new Error(`No Prosemirror schema entry for node ${node.type}`);
    }
    return definition.group === "inline";
};

const dedupeMarks = (marks: ProsemirrorMark[]): ProsemirrorMark[] => {
    const collected: ProsemirrorMark[] = [];
    for (const mark of marks) {
        if (!collected.some(existingMark => compareMarks(existingMark, mark))) {
            collected.push(mark);
        }
    }
    return collected;
};

const applyMarksToNodes = (
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
        if (!node.children && !acceptMarksHere && marksAtNode.length > 0) {
            console.warn(
                `Dropping marks at leaf node ${node.type}. This node should probably have group="inline".`
            );
        }
        const nextAppliedMarks = [
            ...appliedMarks,
            ...(acceptMarksHere ? marksAtNode : []),
        ];
        const nextPendingMarks = acceptMarksHere ? [] : cumulativeMarks;
        const childrenProps = node.children
            ? {
                  children: node.children.map(child =>
                      applyInner(child, nextAppliedMarks, nextPendingMarks)
                  ),
              }
            : {};
        return {
            ...node,
            ...marksProps,
            ...childrenProps,
        };
    };

    return nodes.map(node => applyInner(node, [], []));
};

const fromPandocInner = (
    elementOrArray: PandocNode | PandocNode[],
    context: TransformContext<PandocNode, ProsemirrorNode>,
    marks: ProsemirrorMark[]
): ProsemirrorFluent => {
    if (!elementOrArray) {
        return prosemirrorFluent([]);
    }
    const { rules, marksMap } = context;
    const elements = asArray(elementOrArray);
    const transformed: ProsemirrorNode[] = [];
    let ptr = 0;
    while (ptr < elements.length) {
        const remaining = elements.slice(ptr);
        const { rule, acceptedCount } = getTransformRuleForElements(
            rules,
            remaining,
            matchPandocNode
        );
        const addition = flatten(
            rule.acceptsMultiple
                ? rule.transform(
                      elements.slice(ptr, ptr + acceptedCount),
                      context
                  )
                : rule.transform(elements[ptr], context)
        );
        for (const element of addition) {
            marksMap.set(element, [...(marksMap.get(element) || []), ...marks]);
            transformed.push(element);
        }
        ptr += acceptedCount;
    }
    return prosemirrorFluent(transformed);
};

export const fromPandoc = (
    elementOrArray: PandocNode | PandocNode[],
    rules: RuleSet<PandocNode, ProsemirrorNode>
): ProsemirrorFluent => {
    const context = {
        rules: rules.fromPandoc,
        resource: x => x,
        transform: (element, marks = []) =>
            fromPandocInner(element, context, marks),
        marksMap: new Map(),
    };
    const nodes = context.transform(elementOrArray);
    return prosemirrorFluent(
        applyMarksToNodes(
            nodes.asArray(),
            rules.prosemirrorSchema,
            context.marksMap
        )
    );
};
