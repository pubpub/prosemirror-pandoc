import {
    PandocNode,
    ProsemirrorNode,
    ProsemirrorMark,
    Inline,
    Block,
} from "types";

import { asArray, makeCounter } from "transform/util";
import { fluent, Fluent } from "transform/fluent";
import {
    FromPandocTransformContext,
    FromPandocTransformConfig,
} from "transform/types";
import { RuleSet } from "transform/ruleset";

import { applyMarksToNodes } from "./marks";
import { heal } from "./heal";

const fromPandocInner = (
    elementOrArray: PandocNode | PandocNode[],
    context: FromPandocTransformContext
): Fluent<ProsemirrorNode> => {
    if (!elementOrArray) {
        return fluent([] as ProsemirrorNode[]);
    }
    const { ruleset, marksMap } = context;
    const elements = asArray(elementOrArray);
    const transformed: ProsemirrorNode[] = [];
    const localMarksMap = new Map<ProsemirrorNode, ProsemirrorMark[]>();
    let ptr = 0;
    while (ptr < elements.length) {
        const remaining = elements.slice(ptr);
        const { rule, acceptedCount } = ruleset.matchPandocNodes(remaining);
        if (rule.isMarksRule) {
            const accepted = elements[ptr];
            const marks = asArray(rule.transformer(accepted, context));
            if ("content" in accepted) {
                const innerTransformed =
                    typeof accepted.content === "string"
                        ? [{ type: "text", text: accepted.content }]
                        : fromPandocInner(
                              // This cast works around the fact that some Pandoc nodes have nested arrays
                              // as their content property (e.g. OrderedList has Block[][]). This shouldn't
                              // be a problem in practice unless you're trying to do something very stupid
                              // like turn an OrderedList node into an em mark.
                              accepted.content as Block[] | Inline[],
                              context
                          ).asArray();
                for (const node of innerTransformed) {
                    localMarksMap.set(node, marks);
                }
                transformed.push(...innerTransformed);
            }
        } else if (rule.isMarksRule === false) {
            const accepted = rule.acceptsMultiple
                ? elements.slice(ptr, ptr + acceptedCount)
                : elements[ptr];
            const addition = rule.transformer(accepted, context);
            transformed.push(...asArray(addition));
        }
        ptr += acceptedCount;
    }
    for (const [node, localMarks] of localMarksMap.entries()) {
        const currentMarks = marksMap.get(node) || [];
        marksMap.set(node, [...currentMarks, ...localMarks]);
    }
    return fluent(transformed);
};

export const fromPandoc = (
    elementOrArray: PandocNode | PandocNode[],
    ruleset: RuleSet<any>,
    config: Partial<FromPandocTransformConfig> = {}
): Fluent<ProsemirrorNode> => {
    const {
        resources = {},
        useSmartQuotes = false,
        prosemirrorDocWidth = 1000,
    } = config;
    const context: FromPandocTransformContext = {
        ruleset,
        resources,
        useSmartQuotes,
        count: makeCounter(),
        transform: (element, parentContext = {}) =>
            fromPandocInner(element, { ...context, ...parentContext }),
        marksMap: new Map(),
        prosemirrorDocWidth,
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
