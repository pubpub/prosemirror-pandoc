import { Schema as ProsemirrorSchema } from "prosemirror-model";

import { PandocNode, ProsemirrorMark, ProsemirrorNode } from "../types";

import { Fluent } from "./fluent";
import { RuleSet } from "./ruleset";

// Function type that allows rules to transform their child nodes and pass appropriate context
// into this sub-transformation
type TransformCallback<
    From extends ProsemirrorNode | PandocNode,
    To extends ProsemirrorNode | PandocNode,
    TransformParentContext extends Record<string, any> = Record<string, never>
> = (
    from: From | From[],
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
    prosemirrorSchema: ProsemirrorSchema;
};

// Transform config with Pandoc-specific options
type FromPandocTransformConfig = SharedTransformConfig & {
    useSmartQuotes: boolean;
};

// Transform config with Prosemirror-specific options
type FromProsemirrorTransformConfig = SharedTransformConfig;

// Transform context for Pandoc
export type FromPandocTransformContext = FromPandocTransformConfig &
    SharedTransformContext & {
        marksMap: Map<ProsemirrorNode, ProsemirrorMark>;
        transform: TransformCallback<
            PandocNode,
            ProsemirrorNode,
            { marks: ProsemirrorMark[] }
        >;
    };

// Transform context for Prosemirror
export type FromProsemirrorTransformContext = FromProsemirrorTransformConfig &
    SharedTransformContext & {
        transform: TransformCallback<ProsemirrorNode, PandocNode>;
    };

export type PandocNodeToProsemirrorNodeTransformer<
    From extends PandocNode = PandocNode,
    To extends ProsemirrorNode = ProsemirrorNode
> = (node: From, context: FromPandocTransformContext) => To | To[];

export type PandocNodeToProsemirrorMarkTransformer<
    From extends PandocNode = PandocNode,
    To extends ProsemirrorMark = ProsemirrorMark
> = (node: From, context: FromPandocTransformContext) => To | To[];

export type ProsemirrorNodeToPandocNodeTransformer<
    From extends ProsemirrorNode = ProsemirrorNode,
    To extends PandocNode = PandocNode
> = (node: From, context: FromProsemirrorTransformContext) => To | To[];

export type ProsemirrorMarkToPandocNodeTransformer<
    From extends ProsemirrorMark = ProsemirrorMark,
    To extends PandocNode = PandocNode
> = (
    mark: From,
    content: "content" extends keyof To ? To["content"] : never,
    context: FromProsemirrorTransformContext
) => To | To[];
