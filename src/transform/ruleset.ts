import { PandocNode, ProsemirrorSchema } from "types";
import { parseExpr, exprAcceptsMultiple, acceptItems } from "expression";

import {
    InferPandocPattern,
    InferProsemirrorMarkType,
    InferProsemirrorElementType,
    InferProsemirrorNodePattern,
    InferPandocNodeType,
} from "./inference";
import {
    BidirectionalTransformer,
    PandocNodeToProsemirrorMarkTransformer,
    PandocNodeToProsemirrorNodeTransformer,
    ParameterizedBidirectionalTransformer,
    ProsemirrorMarkToPandocNodeTransformer,
    ProsemirrorNodeToPandocNodeTransformer,
    Rule,
} from "./typesNew";

const matchPandocNode =
    (identifier: string) =>
    (node: PandocNode): boolean =>
        identifier === node.type;

const assertExpressionsSafeForParameterizedTransformer = (
    pandocPattern: string,
    prosemirrorPattern: string
) => {
    const pdExpr = parseExpr(pandocPattern);
    const pmExpr = parseExpr(prosemirrorPattern);
    if (pdExpr.type !== "identifier" && pmExpr.type !== "identifier") {
        throw new Error(
            "Cannot use a transformer that takes node names as arguments in a rule that accepts patterns." +
                " For instance, calling rules.transform('A | B', 'a', tr) will fail if tr is a function" +
                " of two arguments (pandocNodeType, prosemirrorNodeType), because 'A | B' is not" +
                " a valid Pandoc node name. You will need to call the transformer with two statically known" +
                " argument types and pass the result into the transform rule instead," +
                " e.g. rules.transform('A | B', 'a', tr('A', 'a')).\n" +
                `(Attempting to transform between ${pandocPattern} and ${prosemirrorPattern}`
        );
    }
};

const throwFailedMatchError = <WithType extends { type: string }>(
    items: WithType[]
) => {
    throw new Error(
        `Could not find transform rule for nodes: ${
            items
                .map((item) => item.type)
                .slice(0, 3)
                .join(", ") + (items.length > 3 ? "..." : "")
        }`
    );
};

const throwMarkMatchingError = (pattern: string) => {
    throw new Error(
        `Pattern for mark conversion must accept exactly one Pandoc node or Prosemirror mark (${pattern} was supplied)`
    );
};

export class RuleSet<Schema extends ProsemirrorSchema> {
    private pandocNodeToProsemirrorRules: (
        | Rule<PandocNodeToProsemirrorMarkTransformer>
        | Rule<PandocNodeToProsemirrorNodeTransformer>
    )[] = [];
    private prosemirrorNodeToPandocNodeRules: Rule<ProsemirrorNodeToPandocNodeTransformer>[] =
        [];
    private prosemirrorMarkToPandocNodeRules: Rule<ProsemirrorMarkToPandocNodeTransformer>[] =
        [];
    readonly prosemirrorSchema: Schema;

    constructor(schema: Schema) {
        this.prosemirrorSchema = schema;
    }

    toProsemirrorNode<PandocNodePattern extends string>(
        pattern: PandocNodePattern,
        transformer: PandocNodeToProsemirrorNodeTransformer<
            InferPandocPattern<PandocNodePattern>
        >
    ) {
        const expression = parseExpr(pattern);
        this.pandocNodeToProsemirrorRules.push({
            isMarksRule: false,
            acceptsMultiple: exprAcceptsMultiple(expression),
            expression,
            transformer,
        });
    }

    toProsemirrorMark<PandocNodePattern extends string>(
        pattern: PandocNodePattern,
        transformer: PandocNodeToProsemirrorMarkTransformer<
            InferPandocPattern<PandocNodePattern>
        >
    ) {
        const expression = parseExpr(pattern);
        const acceptsMultiple = exprAcceptsMultiple(expression);
        if (acceptsMultiple) {
            throwMarkMatchingError(pattern);
        }
        this.pandocNodeToProsemirrorRules.push({
            isMarksRule: true,
            acceptsMultiple: false,
            expression,
            transformer,
        });
    }

    fromProsemirrorNode<ProsemirrorNodePattern extends string>(
        pattern: ProsemirrorNodePattern,
        transformer: ProsemirrorNodeToPandocNodeTransformer<
            InferProsemirrorNodePattern<ProsemirrorNodePattern, Schema>
        >
    ) {
        const expression = parseExpr(pattern);
        const acceptsMultiple = exprAcceptsMultiple(expression);
        this.prosemirrorNodeToPandocNodeRules.push({
            isMarksRule: false,
            acceptsMultiple,
            expression,
            transformer,
        });
    }

    fromProsemirrorMark<ProsemirrorMarkPattern extends string>(
        pattern: ProsemirrorMarkPattern,
        transformer: ProsemirrorMarkToPandocNodeTransformer<
            InferProsemirrorMarkType<ProsemirrorMarkPattern, Schema>
        >
    ) {
        const expression = parseExpr(pattern);
        const acceptsMultiple = exprAcceptsMultiple(expression);
        if (acceptsMultiple) {
            throwMarkMatchingError(pattern);
        }
        this.prosemirrorMarkToPandocNodeRules.push({
            isMarksRule: true,
            acceptsMultiple: false,
            expression,
            transformer,
        });
    }

    transform<PandocPattern extends string, ProsemirrorPattern extends string>(
        pandocPattern: PandocPattern,
        prosemirrorPattern: ProsemirrorPattern,
        bidirectionalTransformer:
            | BidirectionalTransformer<
                  InferPandocNodeType<PandocPattern>,
                  InferProsemirrorElementType<ProsemirrorPattern, Schema>
              >
            | ParameterizedBidirectionalTransformer<
                  PandocPattern,
                  ProsemirrorPattern,
                  Schema
              >
    ) {
        if (typeof bidirectionalTransformer === "function") {
            assertExpressionsSafeForParameterizedTransformer(
                pandocPattern,
                prosemirrorPattern
            );
            bidirectionalTransformer = bidirectionalTransformer(
                pandocPattern,
                prosemirrorPattern
            );
        }
        if ("toProsemirrorNode" in bidirectionalTransformer) {
            const { toProsemirrorNode } = bidirectionalTransformer;
            this.toProsemirrorNode(pandocPattern, toProsemirrorNode);
        }
        if ("toProsemirrorMark" in bidirectionalTransformer) {
            const { toProsemirrorMark } = bidirectionalTransformer;
            this.toProsemirrorMark(pandocPattern, toProsemirrorMark);
        }
        if ("fromProsemirrorNode" in bidirectionalTransformer) {
            const { fromProsemirrorNode } = bidirectionalTransformer;
            this.fromProsemirrorNode(prosemirrorPattern, fromProsemirrorNode);
        }
        if ("fromProsemirrorMark" in bidirectionalTransformer) {
            const { fromProsemirrorMark } = bidirectionalTransformer;
            this.fromProsemirrorMark(prosemirrorPattern, fromProsemirrorMark);
        }
    }

    acceptPandocNodes(nodes: PandocNode[]): {
        acceptedCount: number;
        rule:
            | Rule<PandocNodeToProsemirrorMarkTransformer>
            | Rule<PandocNodeToProsemirrorNodeTransformer>;
    } {
        for (const rule of this.pandocNodeToProsemirrorRules) {
            const acceptedCount = acceptItems(
                rule.expression,
                nodes,
                matchPandocNode
            );
            if (acceptedCount > 0) {
                return {
                    acceptedCount,
                    rule,
                };
            }
        }
        throwFailedMatchError(nodes);
    }
}
