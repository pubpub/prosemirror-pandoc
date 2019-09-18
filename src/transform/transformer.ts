import { Node as PandocBaseNode } from "../types";
import { ProsemirrorFluent, PandocFluent } from "./fluent";
import {
    acceptNodes,
    expressionAcceptsMultiple,
    parseExpr,
    Expr,
    IdentifierMatch,
} from "./nodeExpression";

interface MinimalType {
    type: string;
}

type TransformerFn<From, To> = (
    from: From | From[]
) => To extends PandocBaseNode ? PandocFluent : ProsemirrorFluent;

export interface TransformContext<From, To> {
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

export interface RuleSet<PDNode, PMNode> {
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

export const getTransformRuleForElements = <From extends MinimalType, To>(
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
    throw new Error(
        `Could not find rule for nodes: ${nodes
            .map(n => n.type)
            .slice(0, 3)
            .join(", ") + (nodes.length > 3 ? "..." : "")}`
    );
};
