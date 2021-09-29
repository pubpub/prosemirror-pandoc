/**
 * Definitions for the Pandoc AST
 * See https://hackage.haskell.org/package/pandoc-types-1.22/docs/Text-Pandoc-Definition.html
 */

export { Schema as ProsemirrorSchema } from "prosemirror-model";

export type ProsemirrorAttr =
    | undefined
    | null
    | number
    | string
    | ProsemirrorAttr[];

export type ProsemirrorNode<Type = string> = {
    __isMark?: false;
    type: Type;
    content?: ProsemirrorNode[];
    text?: string;
    attrs?: Record<string, ProsemirrorAttr>;
    marks?: ProsemirrorMark[];
};

export type ProsemirrorMark<Type = string> = {
    __isMark?: true;
    type: Type;
    attrs?: Record<string, ProsemirrorAttr>;
};

export type ProsemirrorElement = ProsemirrorNode | ProsemirrorMark;

export type PandocJson = {
    "pandoc-api-version": number[];
    meta: {
        [key: string]: any;
    };
    blocks: { [key: string]: any }[];
};
export type Doc = {
    type: "Doc";
    blocks: Block[];
    meta: {
        [key: string]: MetaValue;
    };
};

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

export type ListAttributes = {
    startNumber: number;
    listNumberStyle: ListNumberStyle;
    listNumberDelim: ListNumberDelim;
};

export type Format = string;

export type Attr = {
    identifier: string;
    classes: string[];
    properties: { [key: string]: string };
};

export type Target = {
    url: string;
    title: string;
};

export type CitationMode = "AuthorInText" | "SuppressAuthor" | "NormalCitation";

export type Citation = {
    citationId: string;
    citationPrefix: Inline[];
    citationSuffix: Inline[];
    citationMode: CitationMode;
    citationNoteNum: number;
    citationHash: number;
};

/* ~~~ Block-level definitions ~~~ */

/* Plain text, not a paragraph */
export type Plain = {
    type: "Plain";
    content: Inline[];
};

/* Paragraph */
export type Para = {
    type: "Para";
    content: Inline[];
};

/* Multiple non-breaking lines */
export type LineBlock = {
    type: "LineBlock";
    content: Inline[][];
};

/* Code block (literal) with attributes */
export type CodeBlock = {
    type: "CodeBlock";
    attr: Attr;
    content: string;
};

/* Raw block */
export type RawBlock = {
    type: "RawBlock";
    format: Format;
    content: string;
};

/* Block quote (list of blocks) */
export type BlockQuote = {
    type: "BlockQuote";
    content: Block[];
};

/* Ordered list (attributes and a list of items, each a list of blocks) */
export type OrderedList = {
    type: "OrderedList";
    listAttributes: ListAttributes;
    content: Block[][];
};

/* Bullet list (list of items, each a list of blocks) */
export type BulletList = {
    type: "BulletList";
    content: Block[][];
};

/* Definition list
 Each list item is a pair consisting of a term (a list of inlines)
 and one or more definitions (each a list of blocks) */
export type DefinitionList = {
    type: "DefinitionList";
    entries: {
        term: Inline[];
        definitions: Block[][];
    }[];
};

/* Header - level (integer) and text (inlines) */
export type Header = {
    type: "Header";
    level: number;
    attr: Attr;
    content: Inline[];
};

/* Horizontal rule */
export type HorizontalRule = {
    type: "HorizontalRule";
};

/* Table stuff */
export type Caption = {
    type: "Caption";
    shortCaption?: Inline[];
    content: Block[];
};

export type ColSpec = {
    type: "ColSpec";
    alignment: Alignment;
} & ({ width: number } | { defaultWidth: true });

export type Cell = {
    type: "Cell";
    attr: Attr;
    alignment: Alignment;
    rowSpan: number;
    colSpan: number;
    content: Block[];
};

export type Row = {
    type: "Row";
    attr: Attr;
    cells: Cell[];
};

export type TableHead = {
    type: "TableHead";
    attr: Attr;
    rows: Row[];
};

export type TableFoot = {
    type: "TableFoot";
    attr: Attr;
    rows: Row[];
};

export type TableBody = {
    type: "TableBody";
    attr: Attr;
    rowHeadColumns: number;
    headRows: Row[];
    bodyRows: Row[];
};

export type Table = {
    type: "Table";
    attr: Attr;
    caption: Caption;
    colSpecs: ColSpec[];
    head: TableHead;
    bodies: TableBody[];
    foot: TableFoot;
};

export type TableRow = {
    attr: Attr;
    rowHeadColumns: number;
};

/* Generic block container with attributes */
export type Div = {
    type: "Div";
    attr: Attr;
    content: Block[];
};

/* Nothing */
export type Null = {
    type: "Null";
};

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
export type Str = {
    type: "Str";
    content: string;
};

/* Emphasized text (list of inlines) */
export type Emph = {
    type: "Emph";
    content: Inline[];
};

/* Underlined text (list of inlines) */
export type Underline = {
    type: "Underline";
    content: Inline[];
};

/* Strongly emphasized text (list of inlines) */
export type Strong = {
    type: "Strong";
    content: Inline[];
};

/* Strikeout text (list of inlines) */
export type Strikeout = {
    type: "Strikeout";
    content: Inline[];
};

/* Superscripted text (list of inlines) */
export type Superscript = {
    type: "Superscript";
    content: Inline[];
};

/* Subscripted text (list of inlines) */
export type Subscript = {
    type: "Subscript";
    content: Inline[];
};

/* Small caps text (list of inlines) */
export type SmallCaps = {
    type: "SmallCaps";
    content: Inline[];
};

/* Quoted text (list of inlines) */
export type Quoted = {
    type: "Quoted";
    quoteType: QuoteType;
    content: Inline[];
};

/* Citation (list of inlines) */
export type Cite = {
    type: "Cite";
    citations: Citation[];
    content: Inline[];
};

/* Inline code (literal) */
export type Code = {
    type: "Code";
    attr: Attr;
    content: string;
};

/* Inter-word space */
export type Space = {
    type: "Space";
};

/* Soft line break */
export type SoftBreak = {
    type: "SoftBreak";
};

/* Hard line break */
export type LineBreak = {
    type: "LineBreak";
};

/* TeX math (literal) */
export type Math = {
    type: "Math";
    mathType: MathType;
    content: string;
};

/* Raw inline */
export type RawInline = {
    type: "RawInline";
    format: Format;
    content: string;
};

/* Hyperlink: alt text (list of inlines), target */
export type Link = {
    type: "Link";
    attr: Attr;
    content: Inline[];
    target: Target;
};

/* Image: alt text (list of inlines), target */
export type Image = {
    type: "Image";
    attr: Attr;
    content: Inline[];
    target: Target;
};

/* Footnote or endnote */
export type Note = {
    type: "Note";
    content: Block[];
};

/* Generic inline container with attributes */
export type Span = {
    type: "Span";
    attr: Attr;
    content: Inline[];
};

/* Meta types */

export type MetaMap = {
    type: "MetaMap";
    values: { [key: string]: MetaValue };
};

export type MetaList = {
    type: "MetaList";
    content: MetaValue[];
};

export type MetaBool = {
    type: "MetaBool";
    content: boolean;
};

export type MetaString = {
    type: "MetaString";
    content: string;
};
export type MetaInlines = {
    type: "MetaInlines";
    content: Inline[];
};

export type MetaBlocks = {
    type: "MetaBlocks";
    content: Block[];
};

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

export type PandocNode = Doc | Block | Inline;

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
    "Underline",
];
