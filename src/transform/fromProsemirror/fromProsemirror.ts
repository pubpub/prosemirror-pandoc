import { ProsemirrorNode, PandocNode } from "types";

import { asArray, flatten, makeCounter } from "transform/util";
import { RuleSet } from "transform/ruleset";
import { Fluent, fluent } from "transform/fluent";
import {
    FromProsemirrorTransformConfig,
    FromProsemirrorTransformContext,
} from "transform/types";

import { createWrapperNodeFromMarks, splitNodesByMarks } from "./marks";

const fromProsemirrorInner = (
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
            const { rule, acceptedCount } =
                ruleset.matchProsemirrorNodes(remaining);
            const addition: PandocNode[] = flatten(
                rule.acceptsMultiple
                    ? rule.transformer(
                          nodes.slice(ptr, ptr + acceptedCount),
                          context
                      )
                    : rule.transformer(nodes[ptr], context)
            );
            innerTransformed.push(...addition);
            ptr += acceptedCount;
        }
        const maybeWrappedNodes = createWrapperNodeFromMarks(
            innerTransformed,
            marks,
            context
        );
        transformed.push(...asArray(maybeWrappedNodes));
    }
    return fluent(transformed);
};

export const fromProsemirror = (
    elementOrArray: ProsemirrorNode | ProsemirrorNode[],
    ruleset: RuleSet<any>,
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
