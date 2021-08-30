import { ProsemirrorNode, PandocNode, ProsemirrorMark } from "types";

import { asArray, flatten, makeCounter } from "../util";
import {
    getTransformRuleForElements,
    RuleSet,
    TransformConfig,
    TransformContext,
} from "../transformer";
import { PandocFluent, pandocFluent } from "../fluent";

import { createWrapperNodeForMarks, splitNodesByMarks } from "./marks";

const matchProsemirrorNode = (identifier: string) => (node: ProsemirrorNode) =>
    identifier === node.type;

export const fromProsemirrorInner = (
    elementOrArray: ProsemirrorNode | ProsemirrorNode[],
    context: TransformContext<ProsemirrorNode, PandocNode>
) => {
    if (!elementOrArray) {
        return pandocFluent([]);
    }
    const { rules } = context;
    const nodesAndAssociatedMarks = splitNodesByMarks(asArray(elementOrArray));
    const transformed: PandocNode[] = [];
    for (const { nodes, marks } of nodesAndAssociatedMarks) {
        let ptr = 0;
        const innerTransformed = [];
        while (ptr < nodes.length) {
            const remaining = nodes.slice(ptr);
            const { rule, acceptedCount } = getTransformRuleForElements(
                rules,
                remaining,
                matchProsemirrorNode
            );
            const addition: PandocNode[] = flatten(
                rule.acceptsMultiple
                    ? rule.transform(
                          nodes.slice(ptr, ptr + acceptedCount),
                          context
                      )
                    : rule.transform(nodes[ptr], context)
            );
            for (const element of addition) {
                innerTransformed.push(element);
            }
            ptr += acceptedCount;
        }
        const maybeWrappedNodes = createWrapperNodeForMarks(
            innerTransformed,
            marks
        );
        if (Array.isArray(maybeWrappedNodes)) {
            transformed.push(...maybeWrappedNodes);
        } else {
            transformed.push(maybeWrappedNodes);
        }
    }
    return pandocFluent(transformed);
};

export const fromProsemirror = (
    elementOrArray: ProsemirrorNode | ProsemirrorNode[],
    rules: RuleSet<PandocNode, ProsemirrorNode>,
    config: TransformConfig = {}
): PandocFluent => {
    const context = {
        rules: rules.fromProsemirror,
        resource: config.resource || ((x) => x),
        count: makeCounter(),
        transform: (element) => fromProsemirrorInner(element, context),
    };
    return context.transform(elementOrArray);
};
