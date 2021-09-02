import {
    PANDOC_NODE_TYPES,
    PandocNode,
    ProsemirrorSchema,
    ProsemirrorNode,
    ProsemirrorElement,
    Inline,
    Block,
} from "../types";
import { InferPandocNodeType } from "./inference/inferPandocType";
import {
    acceptItems,
    Expr,
    exprAcceptsMultiple,
    IdentifierMatch,
    parseExpr,
    quickAcceptChoiceExpr,
    exprWillAlwaysMatchSingleIdentifier,
} from "expression";
import {
    Rule,
    RuleSet,
    TransformContext,
    Transformer,
    WrappedBidiTransformer,
} from "./types";

const unwrapTransformer = <
    PdNode extends PandocNode,
    PmElem extends ProsemirrorElement
>(
    wt: WrappedBidiTransformer<PandocNode, ProsemirrorElement>,
    pdPattern: string,
    pmPattern: string
) => {
    const pdExpr = parseExpr(pdPattern);
    const pmExpr = parseExpr(pmPattern);
    if (typeof wt === "function") {
        if (pdExpr.type === "identifier" && pmExpr.type === "identifier") {
            return {
                pdExpr,
                pmExpr,
                transformer: wt(
                    pdExpr.identifier as PdNode["type"],
                    pmExpr.identifier as PmElem["type"]
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

const validateRuleset = (
    ruleset: RuleSet,
    prosemirrorSchema: ProsemirrorSchema
) => {
    const { fromPandoc } = ruleset;
    const expressions = fromPandoc.map((rule) => rule.expression);
    const missingPandocTypes = PANDOC_NODE_TYPES.filter(
        (type) =>
            !expressions.some((expr) =>
                exprWillAlwaysMatchSingleIdentifier(expr, type)
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

export const buildRuleset = (prosemirrorSchema: ProsemirrorSchema) => {
    const ruleset: RuleSet = {
        fromPandoc: [],
        fromProsemirror: [],
        prosemirrorSchema,
    };

    const transform = <PdPattern extends string, PmPattern extends string>(
        pdPattern: PdPattern,
        pmPattern: PmPattern,
        wrappedTransformer: WrappedBidiTransformer<
            InferPandocNodeType<PdPattern>,
            ProsemirrorElement
        >
    ) => {
        const { fromPandoc, fromProsemirror } = createBidirectionalRules(
            pdPattern,
            pmPattern,
            wrappedTransformer
        );
        ruleset.fromPandoc.push(fromPandoc);
        ruleset.fromProsemirror.push(fromProsemirror);
    };

    const fromPandoc = <PdPattern extends string>(
        pdPattern: PdPattern,
        transformFn: Transformer<
            InferPandocNodeType<PdPattern>,
            ProsemirrorNode
        >
    ) => {
        ruleset.fromPandoc.push(createRule(parseExpr(pdPattern), transformFn));
    };

    const transformToMark = (
        pdPattern: string,
        targetMark: string,
        getMarkAttrs: (
            n: PandocNode,
            c: TransformContext<PandocNode, ProsemirrorElement>
        ) => null | Record<string, any> = () => null
    ) => {
        ruleset.fromPandoc.push(
            createPandocToMarkRule(
                parseExpr(pdPattern),
                targetMark,
                getMarkAttrs
            )
        );
    };

    const fromProsemirror = (
        pdPattern: string,
        transformFn: Transformer<ProsemirrorNode, PandocNode>
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
    PdNode extends PandocNode,
    PmElem extends ProsemirrorElement
>(
    pdPattern: string,
    pmPattern: string,
    wrappedTransformer: WrappedBidiTransformer<PdNode, PmElem>
) => {
    const { pdExpr, pmExpr, transformer } = unwrapTransformer(
        wrappedTransformer,
        pdPattern,
        pmPattern
    );

    return {
        fromPandoc: createRule(pdExpr, fromPandoc),
        fromProsemirror: createRule(pmExpr, fromProsemirror),
    };
};

const createRule = <From, To>(
    expression: Expr,
    transform: Transformer<From, To>
): Rule<From, To> => {
    return {
        expression,
        transform,
        acceptsMultiple: exprAcceptsMultiple(expression),
    };
};

const createPandocToMarkRule = <
    From extends PandocNode & { content: Block[] | Inline[] }
>(
    expression: Expr,
    targetMark: string,
    getMarkAttrs: (
        node: From,
        ctx: TransformContext<From, ProsemirrorNode>
    ) => null | Record<string, any>
): Rule<From, ProsemirrorNode> => {
    return createRule(expression, (pandocNode, context) => {
        const { transform } = context;
        const attrs = getMarkAttrs(pandocNode, context);
        const mark = {
            type: targetMark,
            ...(attrs && Object.keys(attrs).length > 0 ? { attrs } : {}),
        };
        return transform(pandocNode.content, { marks: [mark] });
    });
};

export const getTransformRuleForElements = <
    From extends ProsemirrorNode | PandocNode,
    To
>(
    rules: Rule<From, To>[],
    nodes: From[],
    matchTest: IdentifierMatch<From>
): { rule: Rule<From, To>; acceptedCount: number } => {
    for (const rule of rules) {
        const { expression } = rule;
        const acceptChoiceCount = quickAcceptChoiceExpr(expression, nodes);
        if (acceptChoiceCount > 0) {
            return { rule, acceptedCount: acceptChoiceCount };
        }
        const acceptedCount = acceptItems(expression, nodes, matchTest);
        if (acceptedCount > 0) {
            return { rule, acceptedCount };
        }
    }
    throw new Error(
        `Could not find transform rule for nodes: ${
            nodes
                .map((n) => JSON.stringify(n))
                .slice(0, 3)
                .join(", ") + (nodes.length > 3 ? "..." : "")
        }`
    );
};
