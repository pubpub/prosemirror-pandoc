import {
    PandocNode,
    ProsemirrorMark,
    ProsemirrorSchema,
    PANDOC_NODE_TYPES,
} from "../types";
import { ProsemirrorFluent, PandocFluent } from "./fluent";
import {
    acceptNodes,
    expressionAcceptsMultiple,
    parseExpr,
    Expr,
    IdentifierMatch,
    willAlwaysMatchSingleIdentifier,
} from "./nodeExpression";

interface MinimalType {
    type: string;
}

type TransformerFn<From, To> = (
    from: From | From[]
) => To extends PandocNode ? PandocFluent : ProsemirrorFluent;

export interface TransformContext<From, To> {
    transform: TransformerFn<From, To>;
    rules: Rule<From, To>[];
    resource: (url: string) => string;
    marksMap: Map<To, ProsemirrorMark[]>;
}

type TransformDefinition<From, To> = (
    node: From | From[],
    context: TransformContext<From, To>
) => To | To[];

interface Transformer<PDType, PMType> {
    fromPandoc: TransformDefinition<PDType, PMType>;
    fromProsemirror: TransformDefinition<PMType, PDType>;
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
    prosemirrorSchema: ProsemirrorSchema;
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
    transformToMark: (
        pdPattern: string,
        targetMark: string,
        getMarkAttrs?: (n: PDNode) => {}
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

const validateRuleset = <PDNode, PMNode>(
    ruleset: RuleSet<PDNode, PMNode>,
    prosemirrorSchema: ProsemirrorSchema
) => {
    const { fromPandoc } = ruleset;
    const expressions = fromPandoc.map(rule => rule.expression);
    const missingPandocTypes = PANDOC_NODE_TYPES.filter(
        type =>
            !expressions.some(expr =>
                willAlwaysMatchSingleIdentifier(expr, type)
            )
    );
    if (missingPandocTypes.length > 0) {
        console.warn(
            "Cannot find rules that are guaranteed to match on a Pandoc node of these types: " +
                `${missingPandocTypes.join(", ")}.` +
                " You may want to add or modify rules so that the transformer does not break" +
                " if it encounters one of these Pandoc nodes."
        );
    }
    void prosemirrorSchema;
};

export const buildRuleset = <
    PDNode extends MinimalType,
    PMNode extends MinimalType
>(
    prosemirrorSchema: ProsemirrorSchema
): BuildRuleset<PDNode, PMNode> => {
    const ruleset: RuleSet<PDNode, PMNode> = {
        fromPandoc: [],
        fromProsemirror: [],
        prosemirrorSchema,
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

    const transformToMark = <PDType extends PDNode, PMType extends PMNode>(
        pdPattern: string,
        targetMark: string,
        getMarkAttrs: (n: PDType) => {} = () => null
    ) => {
        ruleset.fromPandoc.push(
            createPandocToMarkRule(
                parseExpr(pdPattern),
                targetMark,
                getMarkAttrs
            )
        );
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

    return {
        transform,
        fromPandoc,
        fromProsemirror,
        transformToMark: transformToMark,
        finish,
    };
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

const createPandocToMarkRule = <From, To>(
    expression: Expr,
    targetMark: string,
    getMarkAttrs: (node: From) => {}
): Rule<From, To> => {
    const transform = (pandocNode, { transform }) => {
        const attrs = getMarkAttrs(pandocNode);
        return transform(pandocNode.content, [
            {
                type: targetMark,
                ...(attrs && Object.keys(attrs).length > 0 ? { attrs } : {}),
            },
        ]);
    };
    return createRule(expression, transform);
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
