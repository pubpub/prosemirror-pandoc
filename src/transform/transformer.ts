import { Node as PandocBaseNode, ProsemirrorNode } from "../types";
import { ProsemirrorFluent, PandocFluent, prosemirrorFluent } from "./fluent";
import {
    acceptNodes,
    expressionAcceptsMultiple,
    parseExpr,
    Expr,
    IdentifierMatch,
} from "./nodeExpression";
import { asArray } from "./util";

interface MinimalType {
    type: string;
}

type TransformerFn<From, To> = (
    from: From | From[]
) => To extends PandocBaseNode ? PandocFluent : ProsemirrorFluent;

interface TransformContext<From, To> {
    transform: TransformerFn<From, To>;
    rules: Rule<From, To>[];
    resource: (url: string) => string;
}

type TransformDefinition<From, To> = (
    node: From | From[],
    context: TransformContext<From, To>
) => To | To[];

interface Transformer<PDType, PMType> {
    fromPandoc: (
        node: PDType,
        context: TransformContext<PDType, PMType>
    ) => PMType;
    fromProsemirror: (
        node: PMType,
        context: TransformContext<PMType, PDType>
    ) => PDType;
}

type WrappedTransformer<
    PDType extends MinimalType,
    PMType extends MinimalType
> =
    | Transformer<PDType, PMType>
    | ((
          pdNodeName: PDType["type"],
          pmNodeName: PMType["type"]
      ) => Transformer<PDType, PMType>);

interface Rule<FromFluent, To> {
    transform: TransformDefinition<FromFluent, To>;
    expression: Expr;
    acceptsMultiple: boolean;
}

interface RuleSet<PDNode, PMNode> {
    fromPandoc: Rule<PDNode, PMNode>[];
    fromProsemirror: Rule<PMNode, PDNode>[];
}

export interface BuildRuleset<
    PDNode extends MinimalType,
    PMNode extends MinimalType
> {
    transform: (
        pdPattern: string,
        pmPattern: string,
        transformer: WrappedTransformer<PDNode, PMNode>
    ) => void;
    fromPandoc: (
        pdPattern: string,
        transformDefinition: TransformDefinition<PDNode, PMNode>
    ) => void;
    fromProsemirror: (
        pmPattern: string,
        transformDefinition: TransformDefinition<PMNode, PDNode>
    ) => void;
    finish: () => RuleSet<PDNode, PMNode>;
}

const unwrapTransformer = <
    PDNode extends MinimalType,
    PMNode extends MinimalType
>(
    wt: WrappedTransformer<PDNode, PMNode>,
    pdPattern: string,
    pmPattern: string
): { pdExpr: Expr; pmExpr: Expr; transformer: Transformer<PDNode, PMNode> } => {
    const pdExpr = parseExpr(pdPattern);
    const pmExpr = parseExpr(pmPattern);
    if (typeof wt === "function") {
        if (pdExpr.type === "identifier" && pmExpr.type === "identifier") {
            return {
                pdExpr,
                pmExpr,
                transformer: wt(
                    pdExpr.identifier as PDNode["type"],
                    pmExpr.identifier as PMNode["type"]
                ),
            };
        } else {
            throw new Error(
                "Cannot use a transformer that takes node names as arguments in a rule that accepts patterns." +
                    " For instance, calling rules.transform('A | B', 'a', tr) will fail if tr is a function" +
                    " of two arguments (pandocNodeType, prosemirrorNodeType), because 'A | B' is not" +
                    " a valid Pandoc node name. You will need to call the transformer with two statically known" +
                    " argument types and pass the result into the transform rule instead," +
                    " e.g. rules.transform('A | B', 'a', tr('A', 'a')).\n" +
                    `(Attempting to transform between ${pdPattern} and ${pmPattern}`
            );
        }
    }
    return { transformer: wt, pdExpr, pmExpr };
};

const validateRuleset = (ruleset, prosemirrorSchema) => {
    void prosemirrorSchema;
};

export const buildRuleset = <
    PDNode extends MinimalType,
    PMNode extends MinimalType
>(
    prosemirrorSchema
): BuildRuleset<PDNode, PMNode> => {
    const ruleset: RuleSet<PDNode, PMNode> = {
        fromPandoc: [],
        fromProsemirror: [],
    };

    const transform = <PDType extends PDNode, PMType extends PMNode>(
        pdPattern: string,
        pmPattern: string,
        wrappedTransformer: WrappedTransformer<PDNode, PMNode>
    ) => {
        const { fromPandoc, fromProsemirror } = createBidirectionalRules(
            pdPattern,
            pmPattern,
            wrappedTransformer
        );
        ruleset.fromPandoc.push(fromPandoc);
        ruleset.fromProsemirror.push(fromProsemirror);
    };

    const fromPandoc = <PDType extends PDNode, PMType extends PMNode>(
        pdPattern: string,
        transformFn: TransformDefinition<PDType, PMType>
    ) => {
        ruleset.fromPandoc.push(createRule(parseExpr(pdPattern), transformFn));
    };

    const fromProsemirror = <PMType extends PMNode, PDType extends PDNode>(
        pdPattern: string,
        transformFn: TransformDefinition<PMType, PDType>
    ) => {
        ruleset.fromProsemirror.push(
            createRule(parseExpr(pdPattern), transformFn)
        );
    };

    const finish = () => {
        validateRuleset(ruleset, prosemirrorSchema);
        return ruleset;
    };

    return { transform, fromPandoc, fromProsemirror, finish };
};

const createBidirectionalRules = <
    PDNode extends MinimalType,
    PMNode extends MinimalType
>(
    pdPattern: string,
    pmPattern: string,
    wrappedTransformer: WrappedTransformer<PDNode, PMNode>
) => {
    const {
        pdExpr,
        pmExpr,
        transformer: { fromPandoc, fromProsemirror },
    } = unwrapTransformer(wrappedTransformer, pdPattern, pmPattern);

    return {
        fromPandoc: createRule(pdExpr, fromPandoc),
        fromProsemirror: createRule(pmExpr, fromProsemirror),
    };
};

const createRule = <From, To>(
    expression: Expr,
    transform: TransformDefinition<From, To>
): Rule<From, To> => {
    return {
        expression,
        transform,
        acceptsMultiple: expressionAcceptsMultiple(expression),
    };
};

const findRuleForElements = <From, To>(
    rules: Rule<From, To>[],
    nodes: From[],
    matchTest: IdentifierMatch<From>
): { rule: Rule<From, To>; acceptedCount: number } => {
    for (const rule of rules) {
        const { expression } = rule;
        const acceptedCount = acceptNodes(expression, nodes, matchTest);
        if (acceptedCount > 0) {
            return { rule, acceptedCount };
        }
    }
};

const matchPandocNode = (identifier: string) => (
    node: PandocBaseNode
): boolean => {
    return identifier === node.type;
};

const fromPandocInner = <
    PDNode extends PandocBaseNode,
    PMNode extends ProsemirrorNode
>(
    elementOrArray: PDNode | PDNode[],
    context: TransformContext<PDNode, PMNode>
): ProsemirrorFluent => {
    const { rules } = context;
    if (Array.isArray(elementOrArray)) {
        const elements = elementOrArray;
        const transformed: PMNode[] = [];
        let ptr = 0;
        while (ptr < elements.length) {
            const remaining = elements.slice(ptr);
            const { rule, acceptedCount } = findRuleForElements(
                rules,
                remaining,
                matchPandocNode
            );
            const addition = asArray(
                rule.acceptsMultiple
                    ? rule.transform(
                          elements.slice(ptr, ptr + acceptedCount),
                          context
                      )
                    : rule.transform(elements[ptr], context)
            );
            for (const element of addition) {
                if (Array.isArray(element)) {
                    for (const subelement of element) {
                        transformed.push(subelement);
                    }
                } else {
                    transformed.push(element);
                }
            }
            ptr += acceptedCount;
        }
        return prosemirrorFluent(transformed);
    }
    const element = elementOrArray;
    const { rule } = findRuleForElements(rules, [element], matchPandocNode);
    return prosemirrorFluent(rule.transform(element, context));
};

export const fromPandoc = <
    PDNode extends PandocBaseNode,
    PMNode extends ProsemirrorNode
>(
    elementOrArray: PDNode | PDNode[],
    rules: RuleSet<PDNode, PMNode>
): ProsemirrorFluent => {
    const context = {
        rules: rules.fromPandoc,
        resource: x => x,
        transform: el => fromPandocInner(el, context),
    };
    return context.transform(elementOrArray);
};
