import {
    Doc,
    PandocJson,
    Table,
    Attr,
    Target,
    Format,
    ListAttributes,
    ListNumberStyle,
    ListNumberDelim,
    Alignment,
    Header,
    DefinitionList,
    PandocBlockNodeType,
    Block,
    BulletList,
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

export const emitBulletList = (bulletList: BulletList) => {
    return {
        t: "BulletList",

    }
}

export const emitDefinitionList = (definitionList: DefinitionList) => {
    const { entries } = definitionList;
    return {
        t: "DefinitionList",
        c: [entries.map(entry => {
            const {term, definitions} = entry;
            return [
                term.map(emitInline),
                definitions.map(definition => definition.map(emitBlock))
            ]
        })]
    }
};

export const emitHeader = (header: Header) => {
    const { level, attr, content } = header;
    return {
        t: "Header",
        c: [level, wrapAttr(attr), content.map(emitInline)],
    };
};

export const emitDiv = (div: Div) => {
    const { attr, content } = div;
    return {
        t: "Div",
        c: [wrapAttr(attr), content.map(emitBlock)],
    };
};

export const emitTable = (table: Table) => {
    const { caption, alignments, columnWidths, headers, cells } = table;
    return {
        t: "Table",
        c: [
            caption.map(emitInline),
            alignments.map(alignment => wrapEnum<Alignment>(alignment)),
            columnWidths,
            headers.map(blocks => blocks.map(emitBlock)),
            cells.map(row => row.map(cell => cell.map(emitBlock))),
        ],
    };
};

export const emitBlock = (n: Block): {t: string, c?: any[]} => {
    switch (n.t) {
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
            return emitHeader(n as Header);
        case "HorizontalRule":
        case "Null":
            return { t: n.type };
        case "Div":
            return emitDiv(n);
        case "Table":
            return emitTable(n as Table);
    }

export const emitPandocJson = (doc: Doc): PandocJson => {
    const { blocks, meta } = doc;
    return {
        blocks: blocks.map(emitBlock),
        meta,
    };
};
