import { ProsemirrorNode, PandocNode } from "../../types";
import {
    getTransformRuleForElements,
    RuleSet,
    TransformConfig,
    TransformContext,
} from "../transformer";
import { PandocFluent, pandocFluent } from "../fluent";
import { asArray, flatten, makeCounter } from "../util";
import { createWrapperNodeForMarks } from "./marks";

const matchProsemirrorNode = (identifier: string) => (
    node: ProsemirrorNode
): boolean => {
    return identifier === node.type;
};

export const fromProsemirrorInner = (
    elementOrArray: ProsemirrorNode | ProsemirrorNode[],
    context: TransformContext<ProsemirrorNode, PandocNode>
) => {
    if (!elementOrArray) {
        return pandocFluent([]);
    }
    const { rules } = context;
    const elementsAndMarks = splitElementsByMarks(asArray(elementOrArray));
    const transformed: PandocNode[] = [];
    for (const [elements, marks] of elementsAndMarks) {
        let ptr = 0;
        const innerTransformed = [];
        while (ptr < elements.length) {
            const remaining = elements.slice(ptr);
            const { rule, acceptedCount } = getTransformRuleForElements(
                rules,
                remaining,
                matchProsemirrorNode
            );
            const addition: PandocNode[] = flatten(
                rule.acceptsMultiple
                    ? rule.transform(
                          elements.slice(ptr, ptr + acceptedCount),
                          context
                      )
                    : rule.transform(elements[ptr], context)
            );
            for (const element of addition) {
                innerTransformed.push(element);
            }
            ptr += acceptedCount;
        }
        const maybeWrappedNodes = createWrapperNodeFromMarks(
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
        resource: config.resource || (x => x),
        count: makeCounter(),
        transform: element => fromProsemirrorInner(element, context),
    };
    return context.transform(elementOrArray);
};
