import { flatten, asArray } from "../util";

import { PandocNode, ProsemirrorNode, ProsemirrorMark } from "../../types";
import { ProsemirrorFluent, prosemirrorFluent } from "../fluent";
import {
    TransformContext,
    RuleSet,
    getTransformRuleForElements,
} from "../transformer";
import { applyMarksToNodes } from "./marks";
import { heal } from "./heal";

const matchPandocNode = (identifier: string) => (node: PandocNode): boolean => {
    return identifier === node.type;
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
        ).map(node => heal(node, rules.prosemirrorSchema))
    );
};
