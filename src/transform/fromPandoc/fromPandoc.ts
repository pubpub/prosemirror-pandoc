import { PandocNode, ProsemirrorNode, ProsemirrorMark } from "types";

import { flatten, asArray, makeCounter } from "transform/util";
import { fluent, Fluent } from "transform/fluent";
import { getTransformRuleForElements } from "transform/transformer";
import {
    FromPandocTransformContext,
    FromPandocTransformConfig,
} from "transform/typesNew";
import { RuleSet } from "transform/ruleset";

import { applyMarksToNodes } from "./marks";
import { heal } from "./heal";

const matchPandocNode =
    (identifier: string) =>
    (node: PandocNode): boolean => {
        return identifier === node.type;
    };

const fromPandocInner = (
    elementOrArray: PandocNode | PandocNode[],
    context: FromPandocTransformContext,
    marks: ProsemirrorMark[]
): Fluent<ProsemirrorNode> => {
    if (!elementOrArray) {
        return fluent([] as ProsemirrorNode[]);
    }
    const { ruleset, marksMap } = context;
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
    return fluent(transformed);
};

export const fromPandoc = (
    elementOrArray: PandocNode | PandocNode[],
    ruleset: RuleSet<any>,
    config: Partial<FromPandocTransformConfig> = {}
): Fluent<ProsemirrorNode> => {
    const {
        resource = (x) => x,
        useSmartQuotes = false,
        prosemirrorDocWidth = 1000,
    } = config;
    const context: FromPandocTransformContext = {
        ruleset,
        resource,
        useSmartQuotes,
        count: makeCounter(),
        transform: (
            element,
            { marks = [], context: parentContext = {} } = {}
        ) => fromPandocInner(element, { ...context, ...parentContext }, marks),
        marksMap: new Map(),
        prosemirrorDocWidth,
        textAlign: "left",
    };
    const nodes = context.transform(elementOrArray);
    const nodesWithMarks = applyMarksToNodes(
        nodes.asArray(),
        ruleset.prosemirrorSchema,
        context.marksMap
    );
    const healed = nodesWithMarks.map((node) =>
        heal(node, ruleset.prosemirrorSchema)
    );
    return fluent(healed);
};
