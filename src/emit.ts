import { PANDOC_API_VERSION } from "./config";
import {
    Alignment,
    Attr,
    Block,
    BlockQuote,
    BulletList,
    Caption,
    Cell,
    CitationMode,
    Cite,
    Code,
    CodeBlock,
    ColSpec,
    DefinitionList,
    Div,
    Doc,
    Format,
    Header,
    Image,
    Inline,
    LineBlock,
    Link,
    ListAttributes,
    ListNumberDelim,
    ListNumberStyle,
    Math,
    MathType,
    Note,
    OrderedList,
    PandocJson,
    PandocNode,
    Para,
    Plain,
    Quoted,
    QuoteType,
    RawBlock,
    RawInline,
    Row,
    SimpleInline,
    Span,
    Str,
    Table,
    TableBody,
    TableFoot,
    TableHead,
    Target,
} from "./types";

const wrapEnum = <T>(instance: T): { t: T } => {
    return { t: instance };
};

const wrapAttr = (attr: Attr) => {
    const { identifier, classes, properties } = attr;
    return [identifier, classes, Object.entries(properties)];
};

const wrapTarget = (target: Target) => {
    const { url, title } = target;
    return [url, title];
};

const wrapFormat = (format: Format) => {
    return format;
};

const wrapListAttributes = (listAttributes: ListAttributes) => {
    const {
        startNumber = 1,
        listNumberStyle,
        listNumberDelim,
    } = listAttributes;
    return [
        startNumber,
        wrapEnum<ListNumberStyle>(listNumberStyle),
        wrapEnum<ListNumberDelim>(listNumberDelim),
    ];
};

const emitAtom = (n: PandocNode) => {
    return { t: n.type };
};

const emitStr = (str: Str) => {
    const { content } = str;
    return {
        t: "Str",
        c: content,
    };
};

const emitSimpleInline = (node: SimpleInline) => {
    const { type, content } = node;
    return {
        t: type,
        c: content.map(emitInline),
    };
};

const emitQuoted = (quoted: Quoted) => {
    const { quoteType, content } = quoted;
    return {
        t: "Quoted",
        c: [wrapEnum<QuoteType>(quoteType), content.map(emitInline)],
    };
};

const emitCite = (cite: Cite) => {
    const { citations, content } = cite;
    return {
        t: "Cite",
        c: [
            citations.map((citation) => {
                const {
                    citationHash,
                    citationId,
                    citationMode,
                    citationNoteNum,
                    citationPrefix,
                    citationSuffix,
                } = citation;
                return {
                    citationHash,
                    citationId,
                    citationMode: wrapEnum<CitationMode>(citationMode),
                    citationNoteNum,
                    citationPrefix: citationPrefix.map(emitInline),
                    citationSuffic: citationSuffix.map(emitInline),
                };
            }),
            content.map(emitInline),
        ],
    };
};

const emitCode = (code: Code) => {
    const { attr, content } = code;
    return {
        t: "Code",
        c: [wrapAttr(attr), content],
    };
};

const emitMath = (math: Math) => {
    const { mathType, content } = math;
    return {
        t: "Math",
        c: [wrapEnum<MathType>(mathType), content],
    };
};

const emitRawInline = (rawInline: RawInline) => {
    const { format, content } = rawInline;
    return {
        t: "RawInline",
        c: [wrapFormat(format), content],
    };
};

const emitImage = (image: Image) => {
    const { attr, content, target } = image;
    return {
        t: "Image",
        c: [wrapAttr(attr), content.map(emitInline), wrapTarget(target)],
    };
};

const emitLink = (link: Link) => {
    const { attr, content, target } = link;
    return {
        t: "Link",
        c: [wrapAttr(attr), content.map(emitInline), wrapTarget(target)],
    };
};

const emitNote = (note: Note) => {
    const { content } = note;
    return {
        t: "Note",
        c: content.map(emitBlock),
    };
};

const emitSpan = (span: Span) => {
    const { attr, content } = span;
    return {
        t: "Span",
        c: [wrapAttr(attr), content.map(emitInline)],
    };
};

export const emitInline = (n: Inline): { t: string; c?: string | any[] } => {
    switch (n.type) {
        case "Str":
            return emitStr(n);
        case "Emph":
        case "Strong":
        case "Underline":
        case "Strikeout":
        case "Superscript":
        case "Subscript":
        case "SmallCaps":
            return emitSimpleInline(n);
        case "Quoted":
            return emitQuoted(n);
        case "Cite":
            return emitCite(n);
        case "Code":
            return emitCode(n);
        case "Space":
        case "SoftBreak":
        case "LineBreak":
            return emitAtom(n);
        case "Math":
            return emitMath(n);
        case "RawInline":
            return emitRawInline(n);
        case "Link":
            return emitLink(n);
        case "Image":
            return emitImage(n);
        case "Note":
            return emitNote(n);
        case "Span":
            return emitSpan(n);
    }
};

const emitPlain = (plain: Plain) => {
    const { content } = plain;
    return {
        t: "Plain",
        c: content.map(emitInline),
    };
};

const emitPara = (para: Para) => {
    const { content } = para;
    return {
        t: "Para",
        c: content.map(emitInline),
    };
};

const emitLineBlock = (lineBlock: LineBlock) => {
    const { content } = lineBlock;
    return {
        t: "LineBlock",
        c: content.map((line) => line.map(emitInline)),
    };
};

const emitCodeBlock = (codeBlock: CodeBlock) => {
    const { attr, content } = codeBlock;
    return {
        t: "CodeBlock",
        c: [wrapAttr(attr), content],
    };
};

const emitRawBlock = (rawBlock: RawBlock) => {
    const { format, content } = rawBlock;
    return {
        t: "RawBlock",
        c: [wrapFormat(format), content],
    };
};

const emitBlockQuote = (blockQuote: BlockQuote) => {
    const { content } = blockQuote;
    return {
        t: "BlockQuote",
        c: content.map(emitBlock),
    };
};

const emitOrderedList = (orderedList: OrderedList) => {
    const { content, listAttributes } = orderedList;
    return {
        t: "OrderedList",
        c: [
            wrapListAttributes(listAttributes),
            content.map((entry) => entry.map(emitBlock)),
        ],
    };
};

const emitBulletList = (bulletList: BulletList) => {
    const { content } = bulletList;
    return {
        t: "BulletList",
        c: content.map((entry) => entry.map(emitBlock)),
    };
};

const emitDefinitionList = (definitionList: DefinitionList) => {
    const { entries } = definitionList;
    return {
        t: "DefinitionList",
        c: [
            entries.map((entry) => {
                const { term, definitions } = entry;
                return [
                    term.map(emitInline),
                    definitions.map((definition) => definition.map(emitBlock)),
                ];
            }),
        ],
    };
};

const emitHeader = (header: Header) => {
    const { level, attr, content } = header;
    return {
        t: "Header",
        c: [level, wrapAttr(attr), content.map(emitInline)],
    };
};

const emitDiv = (div: Div) => {
    const { attr, content } = div;
    return {
        t: "Div",
        c: [wrapAttr(attr), content.map(emitBlock)],
    };
};

const emitCell = (cell: Cell) => {
    const { attr, alignment, rowSpan, colSpan, content } = cell;
    return [
        wrapAttr(attr),
        wrapEnum(alignment),
        rowSpan,
        colSpan,
        content.map(emitBlock),
    ];
};

const emitRow = (row: Row) => {
    const { attr, cells } = row;
    return [wrapAttr(attr), cells.map(emitCell)];
};

const emitTableHead = (head: TableHead) => {
    const { attr, rows } = head;
    return [wrapAttr(attr), rows.map(emitRow)];
};

const emitTableFoot = (foot: TableFoot) => {
    const { attr, rows } = foot;
    return [wrapAttr(attr), rows.map(emitRow)];
};

const emitTableBody = (body: TableBody) => {
    const { attr, rowHeadColumns, headRows, bodyRows } = body;
    return [
        wrapAttr(attr),
        rowHeadColumns,
        headRows.map(emitRow),
        bodyRows.map(emitRow),
    ];
};

const emitColSpec = (colSpec: ColSpec) => {
    const { alignment } = colSpec;
    return [
        wrapEnum<Alignment>(alignment),
        "defaultWidth" in colSpec
            ? { t: "ColWidthDefault" }
            : { t: "ColWidth", c: colSpec.width },
    ];
};

const emitCaption = (caption: Caption) => {
    const { shortCaption, content } = caption;
    return [
        shortCaption ? shortCaption.map(emitInline) : null,
        content.map(emitBlock),
    ];
};

const emitTable = (table: Table) => {
    const { attr, caption, colSpecs, head, bodies, foot } = table;
    return {
        t: "Table",
        c: [
            wrapAttr(attr),
            emitCaption(caption),
            colSpecs.map(emitColSpec),
            emitTableHead(head),
            bodies.map(emitTableBody),
            emitTableFoot(foot),
        ],
    };
};

export const emitBlock = (n: Block): { t: string; c?: any[] } => {
    switch (n.type) {
        case "Plain":
            return emitPlain(n);
        case "Para":
            return emitPara(n);
        case "LineBlock":
            return emitLineBlock(n);
        case "CodeBlock":
            return emitCodeBlock(n);
        case "RawBlock":
            return emitRawBlock(n);
        case "BlockQuote":
            return emitBlockQuote(n);
        case "OrderedList":
            return emitOrderedList(n);
        case "BulletList":
            return emitBulletList(n);
        case "DefinitionList":
            return emitDefinitionList(n);
        case "Header":
            return emitHeader(n);
        case "HorizontalRule":
        case "Null":
            return emitAtom(n);
        case "Div":
            return emitDiv(n);
        case "Table":
            return emitTable(n);
    }
};

export const emitPandocJson = (doc: Doc): PandocJson => {
    const { blocks, meta } = doc;
    return {
        "pandoc-api-version": PANDOC_API_VERSION,
        blocks: blocks.map(emitBlock),
        meta,
    };
};
