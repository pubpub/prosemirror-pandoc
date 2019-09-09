/**
 * Definitions for the Pandoc AST
 * See https://hackage.haskell.org/package/pandoc-types-1.17.6/docs/Text-Pandoc-Definition.html
 */

export type BlockNodeType =
    | "Plain"
    | "Para"
    | "LineBlock"
    | "CodeBlock"
    | "RawBlock"
    | "BlockQuote"
    | "OrderedList"
    | "BulletList"
    | "DefinitionList"
    | "Header"
    | "HorizontalRule"
    | "Table"
    | "Div"
    | "Null";

export type InlineNodeType =
    | "Str"
    | "Emph"
    | "Strong"
    | "Strikeout"
    | "Superscript"
    | "Subscript"
    | "SmallCaps"
    | "Quoted"
    | "Cite"
    | "Code"
    | "Space"
    | "SoftBreak"
    | "LineBreak"
    | "Math"
    | "RawInline"
    | "Link"
    | "Image"
    | "Note"
    | "Span";

export interface Doc {
    blocks: Block[];
    meta: {};
}

export type NodeType = BlockNodeType | InlineNodeType;

export interface Node {
    type: NodeType;
    content?: any[] | string;
}

export interface Block extends Node {
    type: BlockNodeType;
}

export interface Inline extends Node {
    type: InlineNodeType;
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
export interface Plain extends Block {
    type: "Plain";
    content: Inline[];
}

/* Paragraph */
export interface Para extends Block {
    type: "Para";
    content: Inline[];
}

/* Multiple non-breaking lines */
export interface LineBlock extends Block {
    type: "LineBlock";
    content: Inline[][];
}

/* Code block (literal) with attributes */
export interface CodeBlock extends Block {
    type: "CodeBlock";
    attr: Attr;
    content: string;
}

/* Raw block */
export interface RawBlock extends Block {
    type: "RawBlock";
    format: Format;
    content: string;
}

/* Block quote (list of blocks) */
export interface BlockQuote extends Block {
    type: "BlockQuote";
    content: Block[];
}

/* Ordered list (attributes and a list of items, each a list of blocks) */
export interface OrderedList extends Block {
    type: "OrderedList";
    listAttributes: ListAttributes;
    content: Block[][];
}

/* Bullet list (list of items, each a list of blocks) */
export interface BulletList extends Block {
    type: "BulletList";
    content: Block[][];
}

/* Definition list
 Each list item is a pair consisting of a term (a list of inlines)
 and one or more definitions (each a list of blocks) */
export interface DefinitionList extends Block {
    type: "DefinitionList";
    terms: Inline[];
    definitions: Block[][];
}

/* Header - level (integer) and text (inlines) */
export interface Header extends Block {
    type: "Header";
    level: number;
    attr: Attr;
    content: Inline[];
}

/* Horizontal rule */
export interface HorizontalRule extends Block {
    type: "HorizontalRule";
}

/* Table, with caption, column alignments (required),
 relative column widths (0 = default), column headers (each a list of blocks),
 and rows (each a list of lists of blocks) */
export interface Table extends Block {
    type: "Table";
    caption: Inline[];
    alignments: Alignment[];
    columnWidths: number[];
    headers: Block[][];
    cells: Block[][][];
}

/* Generic block container with attributes */
export interface Div extends Block {
    type: "Div";
    attr: Attr;
    content: Block[];
}

/* Nothing */
export interface Null extends Block {
    type: "Null";
}

/* ~~~ Inline-level definitions ~~~ */

/* Text (string) */
export interface Str extends Inline {
    type: "Str";
    content: string;
}

/* Emphasized text (list of inlines) */
export interface Emph extends Inline {
    type: "Emph";
    content: Inline[];
}

/* Strongly emphasized text (list of inlines) */
export interface Strong extends Inline {
    type: "Strong";
    content: Inline[];
}

/* Strikeout text (list of inlines) */
export interface Strikeout extends Inline {
    type: "Strikeout";
    content: Inline[];
}

/* Superscripted text (list of inlines) */
export interface Superscript extends Inline {
    type: "Superscript";
    content: Inline[];
}

/* Subscripted text (list of inlines) */
export interface Subscript extends Inline {
    type: "Subscript";
    content: Inline[];
}

/* Small caps text (list of inlines) */
export interface SmallCaps extends Inline {
    type: "SmallCaps";
    content: Inline[];
}

/* Quoted text (list of inlines) */
export interface Quoted extends Inline {
    type: "Quoted";
    quoteType: QuoteType;
    content: Inline[];
}

/* Citation (list of inlines) */
export interface Cite extends Inline {
    type: "Cite";
    citations: Citation[];
    content: Inline[];
}

/* Inline code (literal) */
export interface Code extends Inline {
    type: "Code";
    attr: Attr;
    content: string;
}

/* Inter-word space */
export interface Space extends Inline {
    type: "Space";
}

/* Soft line break */
export interface SoftBreak extends Inline {
    type: "SoftBreak";
}

/* Hard line break */
export interface LineBreak extends Inline {
    type: "LineBreak";
}

/* TeX math (literal) */
export interface Math extends Inline {
    type: "Math";
    mathType: MathType;
    content: string;
}

/* Raw inline */
export interface RawInline extends Inline {
    type: "RawInline";
    format: Format;
    content: string;
}

/* Hyperlink: alt text (list of inlines), target */
export interface Link extends Inline {
    type: "Link";
    attr: Attr;
    content: Inline[];
    target: Target;
}

/* Image: alt text (list of inlines), target */
export interface Image extends Inline {
    type: "Image";
    attr: Attr;
    content: Inline[];
    target: Target;
}

/* Footnote or endnote */
export interface Note extends Inline {
    type: "Note";
    content: Block[];
}

/* Generic inline container with attributes */
export interface Span extends Inline {
    type: "Span";
    attr: Attr;
    content: Inline[];
}
