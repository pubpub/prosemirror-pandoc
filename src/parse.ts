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
    MetaBlocks,
    MetaBool,
    MetaInlines,
    MetaList,
    MetaMap,
    MetaString,
    MetaValue,
    Note,
    OrderedList,
    PandocJson,
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

const unwrapEnum = <T>(instance: { t: T }): T => {
    return instance.t;
};

const unwrapAttr = (attr: [string, string[], [string, string][]]): Attr => {
    const [identifier, classes, propertiesList] = attr;
    const properties = {};
    propertiesList.forEach(([key, value]) => {
        properties[key] = value;
    });
    return {
        identifier,
        classes,
        properties,
    };
};

const unwrapTarget = (target: [string, string]): Target => {
    const [url, title] = target;
    return {
        url,
        title,
    };
};

const unwrapFormat = (format: any): Format => {
    // TODO(ian): Figure out what to do here
    return format;
};

const unwrapListAttributes = (
    listAttributes: [number, any, any]
): ListAttributes => {
    const [startNumber = 1, listNumberStyle, listNumberDelim] = listAttributes;
    return {
        startNumber,
        listNumberStyle: unwrapEnum<ListNumberStyle>(listNumberStyle),
        listNumberDelim: unwrapEnum<ListNumberDelim>(listNumberDelim),
    };
};

const parseAtom = (n: { t }) => {
    return { type: n.t };
};

const parseStr = (n: { c: string }): Str => {
    const string = n.c;
    return {
        type: "Str",
        content: string,
    };
};

const parseSimpleInline = (
    n: {
        c: any[];
    },
    nodeType: SimpleInline["type"]
): SimpleInline => {
    const inline = n.c;
    return {
        type: nodeType,
        content: inline.map(parseInline),
    };
};

const parseQuoted = (n: { c: [any, any[]] }): Quoted => {
    const [quoteType, inline] = n.c;
    return {
        type: "Quoted",
        quoteType: unwrapEnum<QuoteType>(quoteType),
        content: inline.map(parseInline),
    };
};

const parseCite = (n: { c: [any[], any[]] }): Cite => {
    const [citations, inline] = n.c;
    return {
        type: "Cite",
        citations: citations.map((citation) => {
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
                citationMode: unwrapEnum<CitationMode>(citationMode),
                citationNoteNum,
                citationPrefix: citationPrefix.map(parseInline),
                citationSuffix: citationSuffix.map(parseInline),
            };
        }),
        content: inline.map(parseInline),
    };
};

const parseCode = (n: { c: [any, string] }): Code => {
    const [attr, code] = n.c;
    return {
        type: "Code",
        attr: unwrapAttr(attr),
        content: code,
    };
};

const parseMath = (n: { c: [any, string] }): Math => {
    const [mathType, content] = n.c;
    return {
        type: "Math",
        mathType: unwrapEnum<MathType>(mathType),
        content: content,
    };
};

const parseRawInline = (n: { c: [any, string] }): RawInline => {
    const [format, content] = n.c;
    return {
        type: "RawInline",
        format: unwrapFormat(format),
        content,
    };
};

const parseImage = (n: { c: [any, any[], any] }): Image => {
    const [attr, inline, target] = n.c;
    return {
        type: "Image",
        attr: unwrapAttr(attr),
        content: inline.map(parseInline),
        target: unwrapTarget(target),
    };
};

const parseLink = (n: { c: [any, any[], any] }): Link => {
    const [attr, inline, target] = n.c;
    return {
        type: "Link",
        attr: unwrapAttr(attr),
        content: inline.map(parseInline),
        target: unwrapTarget(target),
    };
};

const parseNote = (n: { c: any[] }): Note => {
    const blocks = n.c;
    return {
        type: "Note",
        content: blocks.map(parseBlock),
    };
};

const parseSpan = (n: { c: [any, any[]] }): Span => {
    const [attr, inline] = n.c;
    return {
        type: "Span",
        attr: unwrapAttr(attr),
        content: inline.map(parseInline),
    };
};

export const parseInline = (n: { t: Inline["type"]; c: any }): Inline => {
    switch (n.t) {
        case "Str":
            return parseStr(n);
        case "Emph":
        case "Strong":
        case "Underline":
        case "Strikeout":
        case "Superscript":
        case "Subscript":
        case "SmallCaps":
            return parseSimpleInline(n, n.t);
        case "Quoted":
            return parseQuoted(n);
        case "Cite":
            return parseCite(n);
        case "Code":
            return parseCode(n);
        case "Space":
        case "SoftBreak":
        case "LineBreak":
            return parseAtom(n);
        case "Math":
            return parseMath(n);
        case "RawInline":
            return parseRawInline(n);
        case "Link":
            return parseLink(n);
        case "Image":
            return parseImage(n);
        case "Note":
            return parseNote(n);
        case "Span":
            return parseSpan(n);
    }
};

const parsePlain = (n: { c: any[] }): Plain => {
    const inline = n.c;
    return {
        type: "Plain",
        content: inline.map(parseInline),
    };
};

const parsePara = (n: { c: any[] }): Para => {
    const inline = n.c;
    return {
        type: "Para",
        content: inline.map(parseInline),
    };
};

const parseLineBlock = (n: { c: any[][] }): LineBlock => {
    const lines = n.c;
    return {
        type: "LineBlock",
        content: lines.map((line) => line.map((inline) => parseInline(inline))),
    };
};

const parseCodeBlock = (n: { c: [any, string] }): CodeBlock => {
    const [attr, content] = n.c;
    return {
        type: "CodeBlock",
        attr: unwrapAttr(attr),
        content,
    };
};

const parseRawBlock = (n: { c: [any, string] }): RawBlock => {
    const [format, content] = n.c;
    return {
        type: "RawBlock",
        format: unwrapFormat(format),
        content,
    };
};

const parseBlockQuote = (n: { c: any[] }): BlockQuote => {
    const blocks = n.c;
    return {
        type: "BlockQuote",
        content: blocks.map(parseBlock),
    };
};

const parseOrderedList = (n: { c: [any, any[][]] }): OrderedList => {
    const [listAttributes, items] = n.c;
    return {
        type: "OrderedList",
        listAttributes: unwrapListAttributes(listAttributes),
        content: items.map((item) => item.map(parseBlock)),
    };
};

const parseBulletList = (n: { c: any[][] }): BulletList => {
    const items = n.c;
    return {
        type: "BulletList",
        content: items.map((item) => item.map(parseBlock)),
    };
};

const parseDefinitionList = (n: { c: [any[], any[][]][] }): DefinitionList => {
    const items = n.c;
    const entries = items.map((item) => {
        const [term, definitions] = item;
        return {
            term: term.map(parseInline),
            definitions: definitions.map((definition) =>
                definition.map(parseBlock)
            ),
        };
    });
    return {
        type: "DefinitionList",
        entries,
    };
};

const parseHeader = (n: { c: [number, any, any[]] }): Header => {
    const [level, attr, inline] = n.c;
    return {
        type: "Header",
        level,
        attr: unwrapAttr(attr),
        content: inline.map(parseInline),
    };
};

const parseDiv = (n: { c: [any, any[]] }): Div => {
    const [attr, blocks] = n.c;
    return {
        type: "Div",
        attr: unwrapAttr(attr),
        content: blocks.map(parseBlock),
    };
};

const parseCell = (n: [any, any, any, any, any[]]): Cell => {
    const [attr, alignment, rowSpan, colSpan, blocks] = n;
    return {
        type: "Cell",
        attr: unwrapAttr(attr),
        alignment: unwrapEnum<Alignment>(alignment),
        rowSpan,
        colSpan,
        content: blocks.map(parseBlock),
    };
};

const parseRow = (n: [any, any[]]): Row => {
    const [attr, cells] = n;
    return {
        type: "Row",
        attr: unwrapAttr(attr),
        cells: cells.map(parseCell),
    };
};

const parseTableHead = (n: [any, any[]]): TableHead => {
    const [attr, rows] = n;
    return {
        type: "TableHead",
        attr: unwrapAttr(attr),
        rows: rows.map(parseRow),
    };
};

const parseTableFoot = (n: [any, any[]]): TableFoot => {
    const [attr, rows] = n;
    return {
        type: "TableFoot",
        attr: unwrapAttr(attr),
        rows: rows.map(parseRow),
    };
};

const parseTableBody = (n: [any, any, any[], any[]]): TableBody => {
    const [attr, rowHeadColumns, head, body] = n;
    return {
        type: "TableBody",
        rowHeadColumns,
        attr: unwrapAttr(attr),
        headRows: head.map(parseRow),
        bodyRows: body.map(parseRow),
    };
};

const parseColSpec = (n: [any, any]): ColSpec => {
    const [alignment, colWidth] = n;
    const base = {
        type: "ColSpec" as const,
        alignment: unwrapEnum<Alignment>(alignment),
    };
    if (colWidth.t === "ColWidthDefault") {
        return { ...base, defaultWidth: true };
    }
    return { ...base, width: colWidth.c };
};

const parseCaption = (n: [null | any[], any[]]): Caption => {
    const [shortCaption, content] = n;
    const baseCaption: Caption = {
        type: "Caption",
        content: content.map(parseBlock),
    };
    if (shortCaption) {
        return {
            ...baseCaption,
            shortCaption: shortCaption.map(parseInline),
        };
    }
    return baseCaption;
};

const parseTable = (n: { c: [any, any, any[], any, any[], any] }): Table => {
    const [attr, caption, colSpecs, head, bodies, foot] = n.c;
    return {
        type: "Table",
        attr: unwrapAttr(attr),
        caption: parseCaption(caption),
        colSpecs: colSpecs.map(parseColSpec),
        head: parseTableHead(head),
        bodies: bodies.map(parseTableBody),
        foot: parseTableFoot(foot),
    };
};

export const parseBlock = (n: { t: Block["type"]; c: any }): Block => {
    switch (n.t) {
        case "Plain":
            return parsePlain(n);
        case "Para":
            return parsePara(n);
        case "LineBlock":
            return parseLineBlock(n);
        case "CodeBlock":
            return parseCodeBlock(n);
        case "RawBlock":
            return parseRawBlock(n);
        case "BlockQuote":
            return parseBlockQuote(n);
        case "OrderedList":
            return parseOrderedList(n);
        case "BulletList":
            return parseBulletList(n);
        case "DefinitionList":
            return parseDefinitionList(n);
        case "Header":
            return parseHeader(n);
        case "HorizontalRule":
        case "Null":
            return parseAtom(n);
        case "Div":
            return parseDiv(n);
        case "Table":
            return parseTable(n);
    }
};

const parseMetaMap = (n: { c: { [key: string]: any } }): MetaMap => {
    const values = {};
    Object.entries(n.c).forEach(([key, value]) => {
        values[key] = parseMetaValue(value);
    });
    return { type: "MetaMap", values };
};

const parseMetaList = (n: { c: any[] }): MetaList => {
    return {
        type: "MetaList",
        content: n.c.map(parseMetaValue),
    };
};

const parseMetaBool = (n: { c: boolean }): MetaBool => {
    return {
        type: "MetaBool",
        content: n.c,
    };
};

const parseMetaString = (n: { c: string }): MetaString => {
    return {
        type: "MetaString",
        content: n.c,
    };
};

const parseMetaInlines = (n: { c: any[] }): MetaInlines => {
    return {
        type: "MetaInlines",
        content: n.c.map(parseInline),
    };
};

const parseMetaBlocks = (n: { c: any[] }): MetaBlocks => {
    return {
        type: "MetaBlocks",
        content: n.c.map(parseBlock),
    };
};

const parseMetaValue = (n: { t: string; c: any }): MetaValue => {
    switch (n.t) {
        case "MetaMap":
            return parseMetaMap(n);
        case "MetaList":
            return parseMetaList(n);
        case "MetaBool":
            return parseMetaBool(n);
        case "MetaString":
            return parseMetaString(n);
        case "MetaInlines":
            return parseMetaInlines(n);
        case "MetaBlocks":
            return parseMetaBlocks(n);
    }
};

const parseMeta = (meta: PandocJson["meta"]) => {
    const parsedMeta: { [key: string]: MetaValue } = {};
    Object.entries(meta).forEach(([key, value]) => {
        parsedMeta[key] = parseMetaValue(value);
    });
    return parsedMeta;
};

export const parsePandocJson = (json: PandocJson): Doc => {
    const { meta, blocks } = json;
    return {
        type: "Doc",
        blocks: blocks.map(parseBlock),
        meta: parseMeta(meta),
    };
};
