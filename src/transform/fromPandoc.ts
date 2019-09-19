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

const applyMarksToNode = (
    pm: ProsemirrorFluent,
    schema: ProsemirrorSchema,
    marksMap: Map<ProsemirrorNode, ProsemirrorMark[]>
): ProsemirrorFluent => {
    const applyInner = (
        node: ProsemirrorNode,
        appliedMarks: ProsemirrorMark[],
        pendingMarks: ProsemirrorMark[]
    ): ProsemirrorNode => {
        const marksAtNode = (marksMap.get(node) || []).filter(
            newMark =>
                appliedMarks.some(appliedMark =>
                    compareMarks(newMark, appliedMark)
                ) ||
                pendingMarks.some(pendingMark =>
                    compareMarks(newMark, pendingMark)
                )
        );
        const cumulativeMarks = [...pendingMarks, ...marksAtNode];
        const acceptHere = nodeAcceptsMarks(node, schema);
        const marksProps =
            acceptHere && cumulativeMarks.length > 0
                ? { marks: cumulativeMarks }
                : {};
        if (!node.children && !acceptHere && marksAtNode.length > 0) {
            console.warn(
                `Dropping marks at leaf node ${node.type}. This node should probably have group="inline".`
            );
        }
        const nextAppliedMarks = [
            ...appliedMarks,
            ...(acceptHere ? marksAtNode : []),
        ];
        const nextPendingMarks = acceptHere ? [] : cumulativeMarks;
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
    return prosemirrorFluent(
        pm.asArray().map(node => applyInner(node, [], []))
    );
};

const fromPandocInner = (
    elementOrArray: PandocNode | PandocNode[],
    context: TransformContext<PandocNode, ProsemirrorNode>,
    marks: ProsemirrorMark[]
): ProsemirrorFluent => {
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
    const prosemirror = context.transform(elementOrArray);
    return applyMarksToNode(
        prosemirror,
        rules.prosemirrorSchema,
        context.marksMap
    );
};
