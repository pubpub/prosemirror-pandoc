/**
 * Definitions for the Pandoc AST
 * See https://hackage.haskell.org/package/pandoc-types-1.17.6/docs/Text-Pandoc-Definition.html
 */

interface ProsemirrorNodeDefinition {
    content?: string;
    attrs?: { [key: string]: any };
    group?: string;
    defining?: boolean;
}

interface ProsemirrorMarkDefinition {}

export interface ProsemirrorSchema {
    nodes: { [name: string]: ProsemirrorNodeDefinition };
    marks: { [name: string]: ProsemirrorMarkDefinition };
}

export interface ProsemirrorNode {
    type: string;
    content?: ProsemirrorNode[];
    text?: string;
    attrs?: { [key: string]: string | number | null | undefined };
}

export interface ProsemirrorMark {
    type: string;
    attrs?: { [key: string]: string | number | null | undefined };
}

export interface PandocJson {
    "pandoc-api-version": number[];
    meta: {};
    blocks: {}[];
}
export interface Doc {
    blocks: Block[];
    meta: {};
}

export type Alignment =
    | "AlignLeft"
    | "AlignRight"
    | "AlignCenter"
    | "AlignDefault";

export type QuoteType = "SingleQuote" | "DoubleQuote";
export type MathType = "DisplayMath" | "InlineMath";

export type ListNumberStyle =
    | "DefaultStyle"
    | "Example"
    | "Decimal"
    | "LowerRoman"
    | "UpperRoman"
    | "LowerAlpha"
    | "UpperAlpha";

export type ListNumberDelim =
    | "DefaultDelim"
    | "Period"
    | "OneParen"
    | "TwoParens";

export interface ListAttributes {
    startNumber: number;
    listNumberStyle: ListNumberStyle;
    listNumberDelim: ListNumberDelim;
}

export type Format = string;

export interface Attr {
    identifier: string;
    classes: string[];
    properties: { [key: string]: string };
}

export interface Target {
    url: string;
    title: string;
}

export type CitationMode = "AuthorInText" | "SuppressAuthor" | "NormalCitation";

export interface Citation {
    citationId: string;
    citationPrefix: Inline[];
    citationSuffix: Inline[];
    citationMode: CitationMode;
    citationNoteNum: number;
    citationHash: number;
}

/* ~~~ Block-level definitions ~~~ */

/* Plain text, not a paragraph */
export interface Plain {
    type: "Plain";
    content: Inline[];
}

/* Paragraph */
export interface Para {
    type: "Para";
    content: Inline[];
}

/* Multiple non-breaking lines */
export interface LineBlock {
    type: "LineBlock";
    content: Inline[][];
}

/* Code block (literal) with attributes */
export interface CodeBlock {
    type: "CodeBlock";
    attr: Attr;
    content: string;
}

/* Raw block */
export interface RawBlock {
    type: "RawBlock";
    format: Format;
    content: string;
}

/* Block quote (list of blocks) */
export interface BlockQuote {
    type: "BlockQuote";
    content: Block[];
}

/* Ordered list (attributes and a list of items, each a list of blocks) */
export interface OrderedList {
    type: "OrderedList";
    listAttributes: ListAttributes;
    content: Block[][];
}

/* Bullet list (list of items, each a list of blocks) */
export interface BulletList {
    type: "BulletList";
    content: Block[][];
}

/* Definition list
 Each list item is a pair consisting of a term (a list of inlines)
 and one or more definitions (each a list of blocks) */
export interface DefinitionList {
    type: "DefinitionList";
    entries: {
        term: Inline[];
        definitions: Block[][];
    }[];
}

/* Header - level (integer) and text (inlines) */
export interface Header {
    type: "Header";
    level: number;
    attr: Attr;
    content: Inline[];
}

/* Horizontal rule */
export interface HorizontalRule {
    type: "HorizontalRule";
}

/* Table, with caption, column alignments (required),
 relative column widths (0 = default), column headers (each a list of blocks),
 and rows (each a list of lists of blocks) */
export interface Table {
    type: "Table";
    caption: Inline[];
    alignments: Alignment[];
    columnWidths: number[];
    headers: Block[][];
    cells: Block[][][];
}

/* Generic block container with attributes */
export interface Div {
    type: "Div";
    attr: Attr;
    content: Block[];
}

/* Nothing */
export interface Null {
    type: "Null";
}

export type Block =
    | Plain
    | Para
    | LineBlock
    | CodeBlock
    | RawBlock
    | BlockQuote
    | OrderedList
    | BulletList
    | DefinitionList
    | Header
    | HorizontalRule
    | Table
    | Div
    | Null;

/* ~~~ Inline-level definitions ~~~ */

/* Text (string) */
export interface Str {
    type: "Str";
    content: string;
}

/* Emphasized text (list of inlines) */
export interface Emph {
    type: "Emph";
    content: Inline[];
}

/* Strongly emphasized text (list of inlines) */
export interface Strong {
    type: "Strong";
    content: Inline[];
}

/* Strikeout text (list of inlines) */
export interface Strikeout {
    type: "Strikeout";
    content: Inline[];
}

/* Superscripted text (list of inlines) */
export interface Superscript {
    type: "Superscript";
    content: Inline[];
}

/* Subscripted text (list of inlines) */
export interface Subscript {
    type: "Subscript";
    content: Inline[];
}

/* Small caps text (list of inlines) */
export interface SmallCaps {
    type: "SmallCaps";
    content: Inline[];
}

/* Quoted text (list of inlines) */
export interface Quoted {
    type: "Quoted";
    quoteType: QuoteType;
    content: Inline[];
}

/* Citation (list of inlines) */
export interface Cite {
    type: "Cite";
    citations: Citation[];
    content: Inline[];
}

/* Inline code (literal) */
export interface Code {
    type: "Code";
    attr: Attr;
    content: string;
}

/* Inter-word space */
export interface Space {
    type: "Space";
}

/* Soft line break */
export interface SoftBreak {
    type: "SoftBreak";
}

/* Hard line break */
export interface LineBreak {
    type: "LineBreak";
}

/* TeX math (literal) */
export interface Math {
    type: "Math";
    mathType: MathType;
    content: string;
}

/* Raw inline */
export interface RawInline {
    type: "RawInline";
    format: Format;
    content: string;
}

/* Hyperlink: alt text (list of inlines), target */
export interface Link {
    type: "Link";
    attr: Attr;
    content: Inline[];
    target: Target;
}

/* Image: alt text (list of inlines), target */
export interface Image {
    type: "Image";
    attr: Attr;
    content: Inline[];
    target: Target;
}

/* Footnote or endnote */
export interface Note {
    type: "Note";
    content: Block[];
}

/* Generic inline container with attributes */
export interface Span {
    type: "Span";
    attr: Attr;
    content: Inline[];
}

export type Inline =
    | Str
    | Emph
    | Strong
    | Strikeout
    | Superscript
    | Subscript
    | SmallCaps
    | Quoted
    | Cite
    | Code
    | Space
    | SoftBreak
    | LineBreak
    | Math
    | RawInline
    | Link
    | Image
    | Note
    | Span;

export type PandocNode = Block | Inline;

export const PANDOC_NODE_TYPES = [
    "BlockQuote",
    "BulletList",
    "Cite",
    "Code",
    "CodeBlock",
    "DefinitionList",
    "Div",
    "Emph",
    "Header",
    "HorizontalRule",
    "Image",
    "LineBlock",
    "LineBreak",
    "Link",
    "Math",
    "Note",
    "Null",
    "OrderedList",
    "Para",
    "Plain",
    "Quoted",
    "RawBlock",
    "RawInline",
    "SmallCaps",
    "SoftBreak",
    "Space",
    "Span",
    "Str",
    "Strikeout",
    "Strong",
    "Subscript",
    "Superscript",
    "Table",
];
