import {
    PandocNode,
    ProsemirrorElement,
    ProsemirrorMark,
    ProsemirrorNode,
    ProsemirrorSchema,
} from "types";
import { Expr } from "expression";

import { Fluent } from "./fluent";
import { InferPandocNodeType, InferProsemirrorElementType } from "./inference";
import { RuleSet } from "./ruleset";

export type OneOrMany<T> = T | T[];

// Function type that allows rules to transform their child nodes and pass appropriate context
// into this sub-transformation
type TransformCallback<
    From extends ProsemirrorNode | PandocNode,
    To extends ProsemirrorNode | PandocNode,
    TransformParentContext extends Record<string, any> = Record<string, never>
> = (
    from: OneOrMany<From>,
    context?: Partial<TransformParentContext>
) => Fluent<To>;

// Options passed into the transform process in both directions
type SharedTransformConfig = {
    resource: (input: string, context?: any) => string;
    prosemirrorDocWidth: number;
};

// Items that are available from the transform context in both directions
type SharedTransformContext = {
    ruleset: RuleSet<any>;
    count: (label: string) => number;
};

// Transform config with Pandoc-specific options
export type FromPandocTransformConfig = SharedTransformConfig & {
    useSmartQuotes: boolean;
};

// Transform config with Prosemirror-specific options
export type FromProsemirrorTransformConfig = SharedTransformConfig;

// Transform context for Pandoc
export type FromPandocTransformContext = FromPandocTransformConfig &
    SharedTransformContext & {
        marksMap: Map<ProsemirrorNode, ProsemirrorMark[]>;
        transform: TransformCallback<PandocNode, ProsemirrorNode>;
    };

// Transform context for Prosemirror
export type FromProsemirrorTransformContext = FromProsemirrorTransformConfig &
    SharedTransformContext & {
        transform: TransformCallback<ProsemirrorNode, PandocNode>;
    };

export type PandocNodeToProsemirrorNodeTransformer<
    From extends OneOrMany<PandocNode> = OneOrMany<PandocNode>,
    To extends ProsemirrorNode = ProsemirrorNode
> = (node: From, context: FromPandocTransformContext) => OneOrMany<To>;

export type PandocNodeToProsemirrorMarkTransformer<
    From extends OneOrMany<PandocNode> = OneOrMany<PandocNode>,
    To extends ProsemirrorMark = ProsemirrorMark
> = (node: From, context: FromPandocTransformContext) => OneOrMany<To>;

export type ProsemirrorNodeToPandocNodeTransformer<
    From extends OneOrMany<ProsemirrorNode> = OneOrMany<ProsemirrorNode>,
    To extends PandocNode = PandocNode
> = (node: From, context: FromProsemirrorTransformContext) => OneOrMany<To>;

export type ProsemirrorMarkToPandocNodeTransformer<
    From extends ProsemirrorMark = ProsemirrorMark,
    To extends PandocNode = PandocNode
> = (
    mark: From,
    content: any,
    context: FromProsemirrorTransformContext
) => OneOrMany<To>;

export type NodeTransformer =
    | PandocNodeToProsemirrorNodeTransformer
    | ProsemirrorNodeToPandocNodeTransformer;

export type MarksTransformer =
    | PandocNodeToProsemirrorMarkTransformer
    | ProsemirrorMarkToPandocNodeTransformer;

export type AnyTransformer = NodeTransformer | MarksTransformer;

export type Rule<Transformer extends AnyTransformer> =
    | Readonly<{
          transformer: Transformer extends NodeTransformer
              ? Transformer
              : never;
          expression: Expr;
          capturedExpressions: Expr[];
          acceptsMultiple: boolean;
          isMarksRule: false;
      }>
    | Readonly<{
          transformer: Transformer extends MarksTransformer
              ? Transformer
              : never;
          expression: Expr;
          capturedExpressions: Expr[];
          acceptsMultiple: false;
          isMarksRule: true;
      }>;

export type BidirectionalTransformer<
    PandocType extends PandocNode,
    ProsemirrorType extends ProsemirrorElement
> = (
    | {
          fromProsemirrorNode: ProsemirrorNodeToPandocNodeTransformer<
              Extract<ProsemirrorType, ProsemirrorNode>,
              PandocType
          >;
          toProsemirrorNode: PandocNodeToProsemirrorNodeTransformer<
              PandocType,
              Extract<ProsemirrorType, ProsemirrorNode>
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
      }
) & {
    assertCapturedProsemirrorNodes?: string[];
    assertCapturedPandocNodes?: string[];
};

export type ParameterizedBidirectionalTransformer<
    PandocPattern extends string,
    ProsemirrorPattern extends string,
    Schema extends ProsemirrorSchema
> = (
    pandocPattern: PandocPattern,
    prosemirrorPattern: ProsemirrorPattern
) => BidirectionalTransformer<
    InferPandocNodeType<PandocPattern>,
    InferProsemirrorElementType<ProsemirrorPattern, Schema>
>;
