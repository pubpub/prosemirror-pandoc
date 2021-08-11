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
    meta: {
        [key: string]: any;
    };
    blocks: {}[];
}
export interface Doc {
    type: "Doc";
    blocks: Block[];
    meta: {
        [key: string]: MetaValue;
    };
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

/* Table */

export interface Caption {
    type: "Caption";
    shortCaption?: Inline[];
    content: Block[];
}

export type ColSpec = {
    type: "ColSpec";
    alignment: Alignment;
} & ({ width: number } | { defaultWidth: true });

export interface Cell {
    type: "Cell";
    attr: Attr;
    alignment: Alignment;
    rowSpan: number;
    colSpan: number;
    content: Block[];
}

export interface Row {
    type: "Row";
    attr: Attr;
    cells: Cell[];
}

export interface TableHead {
    type: "TableHead";
    attr: Attr;
    rows: Row[];
}

export interface TableFoot {
    type: "TableFoot";
    attr: Attr;
    rows: Row[];
}

export interface TableBody {
    type: "TableBody";
    attr: Attr;
    rowHeadColumns: number;
    headRows: Row[];
    bodyRows: Row[];
}

export interface Table {
    type: "Table";
    attr: Attr;
    caption: Caption;
    colSpecs: ColSpec[];
    head: TableHead;
    bodies: TableBody[];
    foot: TableFoot;
}

export interface TableRow {
    attr: Attr;
    rowHeadColumns: number;
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

/* Underlined text (list of inlines) */
export interface Underline {
    type: "Underline";
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

/* Meta types */

export interface MetaMap {
    type: "MetaMap";
    values: { [key: string]: MetaValue };
}

export interface MetaList {
    type: "MetaList";
    content: MetaValue[];
}

export interface MetaBool {
    type: "MetaBool";
    content: boolean;
}

export interface MetaString {
    type: "MetaString";
    content: string;
}
export interface MetaInlines {
    type: "MetaInlines";
    content: Inline[];
}

export interface MetaBlocks {
    type: "MetaBlocks";
    content: Block[];
}

export type MetaValue =
    | MetaMap
    | MetaList
    | MetaBool
    | MetaString
    | MetaInlines
    | MetaBlocks;

export type SimpleInline =
    | Emph
    | Underline
    | Strong
    | Strikeout
    | Superscript
    | Subscript
    | SmallCaps;

export type Inline =
    | Str
    | SimpleInline
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

export type PandocNode = Doc | Block | Inline | MetaValue;

export const PANDOC_NODE_TYPES = [
    "BlockQuote",
    "BulletList",
    "Cite",
    "Code",
    "CodeBlock",
    "DefinitionList",
    "Doc",
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
