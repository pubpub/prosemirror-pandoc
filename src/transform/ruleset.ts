import { Schema as ProsemirrorSchema } from "prosemirror-model";

import {
    Block,
    Inline,
    PandocNode,
    ProsemirrorMark,
    ProsemirrorNode,
} from "types";

import { InferPandocNodeType, InferProsemirrorType } from "./inference";
import {
    PandocNodeToProsemirrorMarkTransformer,
    PandocNodeToProsemirrorNodeTransformer,
    ProsemirrorMarkToPandocNodeTransformer,
    ProsemirrorNodeToPandocNodeTransformer,
} from "./typesNew";
import { Expr, parseExpr, exprAcceptsMultiple } from "./expression";

type Rule<Transformer> = {
    transformer: Transformer;
    expression: Expr;
    acceptsMultiple: boolean;
};

type BidirectionalTransformer<
    PandocType extends PandocNode,
    ProsemirrorType extends ProsemirrorNode | ProsemirrorMark
> =
    | {
          fromProsemirrorNode: ProsemirrorNodeToPandocNodeTransformer<
              ProsemirrorType,
              PandocType
          >;
          toProsemirrorNode: PandocNodeToProsemirrorNodeTransformer<
              PandocType,
              ProsemirrorType
          >;
      }
    | {
          fromProsemirrorMark: ProsemirrorMarkToPandocNodeTransformer<
              Extract<ProsemirrorType, ProsemirrorMark>,
              PandocType
          >;
          toProsemirrorMark: PandocNodeToProsemirrorMarkTransformer<
              PandocType,
              Extract<ProsemirrorType, ProsemirrorMark>
          >;
      };

type ParameterizedBidirectionalTransformer<
    PandocPattern extends string,
    ProsemirrorPattern extends string,
    Schema extends ProsemirrorSchema
> = (
    pandocPattern: PandocPattern,
    prosemirrorPattern: ProsemirrorPattern
) => BidirectionalTransformer<
    InferPandocNodeType<PandocPattern>,
    InferProsemirrorType<ProsemirrorPattern, Schema>
>;

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

const createRule = <Transformer>(
    pattern: string,
    transformer: Transformer
): Rule<Transformer> => {
    const expression = parseExpr(pattern);
    return {
        expression,
        transformer,
        acceptsMultiple: exprAcceptsMultiple(expression),
    };
};

export class RuleSet<Schema extends ProsemirrorSchema> {
    private pandocNodeToProsemirrorNodeRules: Rule<PandocNodeToProsemirrorNodeTransformer>[] =
        [];
    private pandocNodeToProsemirrorMarkRules: Rule<PandocNodeToProsemirrorMarkTransformer>[] =
        [];
    private prosemirrorNodeToPandocNodeRules: Rule<ProsemirrorNodeToPandocNodeTransformer>[] =
        [];
    private prosemirrorMarkToPandocNodeRules: Rule<ProsemirrorMarkToPandocNodeTransformer>[] =
        [];
    private schema: Schema;

    constructor(schema: Schema) {
        this.schema = schema;
    }

    toProsemirrorNode<PandocNodePattern extends string>(
        pattern: PandocNodePattern,
        transformer: PandocNodeToProsemirrorNodeTransformer<
            InferPandocNodeType<PandocNodePattern>
        >
    ) {
        const rule = createRule(pattern, transformer);
        this.pandocNodeToProsemirrorNodeRules.push(rule);
    }

    toProsemirrorMark<PandocNodePattern extends string>(
        pattern: PandocNodePattern,
        transformer: PandocNodeToProsemirrorMarkTransformer<
            InferPandocNodeType<PandocNodePattern>
        >
    ) {
        const rule = createRule(pattern, transformer);
        this.pandocNodeToProsemirrorMarkRules.push(rule);
    }

    fromProsemirrorNode(
        pattern: string,
        transformer: ProsemirrorNodeToPandocNodeTransformer
    ) {
        const rule = createRule(pattern, transformer);
        this.prosemirrorNodeToPandocNodeRules.push(rule);
    }

    fromProsemirrorMark(
        pattern: string,
        transformer: ProsemirrorMarkToPandocNodeTransformer
    ) {
        const rule = createRule(pattern, transformer);
        this.prosemirrorMarkToPandocNodeRules.push(rule);
    }

    transform<PandocPattern extends string, ProsemirrorPattern extends string>(
        pandocPattern: PandocPattern,
        prosemirrorPattern: ProsemirrorPattern,
        bidirectionalTransformer:
            | BidirectionalTransformer<
                  InferPandocNodeType<PandocPattern>,
                  InferProsemirrorType<ProsemirrorPattern, Schema>
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
}
