import {
    BlockQuote,
    Emph,
    SmallCaps,
    Strikeout,
    Strong,
    Subscript,
    Superscript,
    Underline,
    Plain,
    Para,
    LineBreak,
} from "types";

type BareBlock = Plain | Para | BlockQuote;

type BareLeaf = LineBreak;

type BareInline =
    | Emph
    | Underline
    | Strong
    | Strikeout
    | Superscript
    | Subscript
    | SmallCaps;

// A transformer appropriate for simple container nodes. Typically, these  are
// correspondences between Pandoc elements with a content property and
// Prosemirror elements with a content property
export const bareContentTransformer = (
    pdNodeType: BareBlock["type"],
    pmNodeType
) => {
    return {
        toProsemirrorNode: (node, { transform }) => {
            return {
                type: pmNodeType,
                content: transform(node.content),
            };
        },
        fromProsemirrorNode: (node, { transform }) => {
            return {
                type: pdNodeType,
                content: transform(node.content),
            };
        },
    };
};

// A transformer between Pandoc inline nodes and Prosemirror marks with no attrs
export const bareMarkTransformer = (
    pdNodeType: BareInline["type"],
    pmMarkType
) => {
    return {
        toProsemirrorMark: () => {
            return {
                type: pmMarkType,
            };
        },
        fromProsemirrorMark: (_, content) => {
            return {
                type: pdNodeType,
                content,
            };
        },
    };
};

// A transformer that does type -> type conversion for simple leaf nodes
export const bareLeafTransformer = (
    pdNodeType: BareLeaf["type"],
    pmNodeType
) => {
    return {
        toProsemirrorNode: () => {
            return {
                type: pmNodeType,
            };
        },
        fromProsemirrorNode: () => {
            return {
                type: pdNodeType,
            };
        },
    };
};
