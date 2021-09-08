import { ProsemirrorNode, PandocNode } from "types";

import { asArray, flatten, makeCounter } from "../util";
import { getTransformRuleForElements } from "../transformerJunk";
import { Fluent, fluent } from "../fluent";

import { createWrapperNodeForMarks, splitNodesByMarks } from "./marks";
import {
    FromProsemirrorTransformConfig,
    FromProsemirrorTransformContext,
} from "transform/typesNew";

const matchProsemirrorNode = (identifier: string) => (node: ProsemirrorNode) =>
    identifier === node.type;

export const fromProsemirrorInner = (
    elementOrArray: ProsemirrorNode | ProsemirrorNode[],
    context: FromProsemirrorTransformContext
): Fluent<PandocNode> => {
    if (!elementOrArray) {
        return fluent([]);
    }
    const { ruleset } = context;
    const nodesAndAssociatedMarks = splitNodesByMarks(asArray(elementOrArray));
    const transformed: PandocNode[] = [];
    for (const { nodes, marks } of nodesAndAssociatedMarks) {
        let ptr = 0;
        const innerTransformed = [];
        while (ptr < nodes.length) {
            const remaining = nodes.slice(ptr);
            ruleset.
            const { rule, acceptedCount } = getTransformRuleForElements(
                ruleset,
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
    return fluent(transformed);
};

export const fromProsemirror = (
    elementOrArray: ProsemirrorNode | ProsemirrorNode[],
    ruleset: RuleSet<PandocNode, ProsemirrorNode>,
    config: Partial<FromProsemirrorTransformConfig> = {}
): Fluent<PandocNode> => {
    const { resource = (x) => x, prosemirrorDocWidth = 1000 } = config;
    const context: FromProsemirrorTransformContext = {
        ruleset,
        resource,
        prosemirrorDocWidth,
        count: makeCounter(),
        transform: (element) => fromProsemirrorInner(element, context),
    };
    return context.transform(elementOrArray);
};
