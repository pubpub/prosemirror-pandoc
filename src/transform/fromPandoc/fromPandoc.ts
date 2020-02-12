import { flatten, asArray } from "../util";

import { PandocNode, ProsemirrorNode, ProsemirrorMark } from "../../types";
import { ProsemirrorFluent, prosemirrorFluent } from "../fluent";
import {
    getTransformRuleForElements,
    RuleSet,
    TransformConfig,
    TransformContext,
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
        const addition: ProsemirrorNode[] = flatten(
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

const makeCounter = () => {
    const countMap: Map<string, number> = new Map();
    return (type: string) => {
        const count = countMap.get(type) || 0;
        countMap.set(type, count + 1);
        return count;
    };
};

export const fromPandoc = (
    elementOrArray: PandocNode | PandocNode[],
    rules: RuleSet<PandocNode, ProsemirrorNode>,
    config: TransformConfig = {}
): ProsemirrorFluent => {
    const context = {
        rules: rules.fromPandoc,
        resource: config.resource || (x => x),
        count: makeCounter(),
        transform: (element, marks = []) =>
            fromPandocInner(element, context, marks),
        marksMap: new Map(),
    };
    const nodes = context.transform(elementOrArray);
    const nodesWithMarks = applyMarksToNodes(
        nodes.asArray(),
        rules.prosemirrorSchema,
        context.marksMap
    );
    const healed = nodesWithMarks.map(node =>
        heal(node, rules.prosemirrorSchema)
    );
    return prosemirrorFluent(healed);
};
