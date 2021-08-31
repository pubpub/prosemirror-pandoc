import {
    PandocNode,
    ProsemirrorElement,
    ProsemirrorMark,
    ProsemirrorNode,
    ProsemirrorSchema,
} from "../types";
import { ProsemirrorFluent, PandocFluent } from "./fluent";
import { Expr } from "./nodeExpression";

export type Transformer<From, To> = (
    node: From,
    context: From extends PandocNode
        ? TransformContext<PandocNode, ProsemirrorNode>
        : TransformContext<ProsemirrorNode, PandocNode>
) => To | To[];

export type BidiTransformer<
    PdNode extends PandocNode = PandocNode,
    PmElem extends ProsemirrorElement = ProsemirrorElement
> = {
    fromPandoc: Transformer<PdNode, PmElem>;
    fromProsemirror: Transformer<PmElem, PdNode>;
};

export type WrappedBidiTransformer<
    PdNode extends PandocNode = PandocNode,
    PmElem extends ProsemirrorElement = ProsemirrorElement
> =
    | BidiTransformer<PdNode, PmElem>
    | ((
          pdNodeName: string,
          pmNodeName: string
      ) => BidiTransformer<PdNode, PmElem>);

export type TransformConfig = {
    resource: (input: string, context?: any) => string;
    useSmartQuotes: boolean;
    prosemirrorDocWidth: number;
};

export type TransformParentContext = {
    textAlign?: "left" | "center" | "right";
};

export type TransformContext<From, To> = TransformConfig &
    TransformParentContext & {
        transform: (
            from: From | From[],
            options?: {
                context?: Partial<TransformParentContext>;
                marks?: ProsemirrorMark[];
            }
        ) => To extends PandocNode ? PandocFluent : ProsemirrorFluent;
        rules: Rule<From, To>[];
        count: (nodeType: string) => number;
        marksMap: Map<To, ProsemirrorMark[]>;
        prosemirrorSchema: ProsemirrorSchema;
    };

export type Rule<From, To> = {
    transform: Transformer<From | From[], To>;
    expression: Expr;
    acceptsMultiple: boolean;
};

export type RuleSet = {
    fromPandoc: Rule<PandocNode, ProsemirrorNode>[];
    fromProsemirror: Rule<ProsemirrorElement, PandocNode>[];
    prosemirrorSchema: ProsemirrorSchema;
};
