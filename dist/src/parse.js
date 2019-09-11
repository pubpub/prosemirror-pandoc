"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spread = (this && this.__spread) || function () {
    for (var ar = [], i = 0; i < arguments.length; i++) ar = ar.concat(__read(arguments[i]));
    return ar;
};
exports.__esModule = true;
var unwrapEnum = function (instance) {
    return instance.t;
};
var unwrapAttr = function (attr) {
    var _a = __read(attr, 3), identifier = _a[0], classes = _a[1], propertiesList = _a[2];
    var properties = {};
    propertiesList.forEach(function (_a) {
        var _b = __read(_a, 2), key = _b[0], value = _b[1];
        properties[key] = value;
    });
    return {
        identifier: identifier,
        classes: classes,
        properties: properties
    };
};
var unwrapTarget = function (target) {
    var _a = __read(target, 2), url = _a[0], title = _a[1];
    return {
        url: url,
        title: title
    };
};
var unwrapFormat = function (format) {
    // TODO(ian): Figure out what to do here
    return format;
};
var unwrapListAttributes = function (listAttributes) {
    var _a = __read(listAttributes, 3), _b = _a[0], startNumber = _b === void 0 ? 1 : _b, listNumberStyle = _a[1], listNumberDelim = _a[2];
    return {
        startNumber: startNumber,
        listNumberStyle: unwrapEnum(listNumberStyle),
        listNumberDelim: unwrapEnum(listNumberDelim)
    };
};
var parseStr = function (n) {
    var string = n.c;
    return {
        type: "Str",
        content: string
    };
};
var parseSimpleInline = function (n, nodeType) {
    var inline = n.c;
    return {
        type: nodeType,
        content: inline.map(exports.parseInline)
    };
};
var parseQuoted = function (n) {
    var _a = __read(n.c, 2), quoteType = _a[0], inline = _a[1];
    return {
        type: "Quoted",
        quoteType: unwrapEnum(quoteType),
        content: inline.map(exports.parseInline)
    };
};
var parseCite = function (n) {
    var _a = __read(n.c, 2), citations = _a[0], inline = _a[1];
    return {
        type: "Cite",
        citations: citations.map(function (citation) {
            var citationHash = citation.citationHash, citationId = citation.citationId, citationMode = citation.citationMode, citationNoteNum = citation.citationNoteNum, citationPrefix = citation.citationPrefix, citationSuffix = citation.citationSuffix;
            return {
                citationHash: citationHash,
                citationId: citationId,
                citationMode: unwrapEnum(citationMode),
                citationNoteNum: citationNoteNum,
                citationPrefix: citationPrefix.map(exports.parseInline),
                citationSuffix: citationSuffix.map(exports.parseInline)
            };
        }),
        content: inline.map(exports.parseInline)
    };
};
var parseCode = function (n) {
    var _a = __read(n.c, 2), attr = _a[0], code = _a[1];
    return {
        type: "Code",
        attr: unwrapAttr(attr),
        content: code
    };
};
var parseMath = function (n) {
    var _a = __read(n.c, 2), mathType = _a[0], content = _a[1];
    return {
        type: "Math",
        mathType: unwrapEnum(mathType),
        content: content
    };
};
var parseRawInline = function (n) {
    var _a = __read(n.c, 2), format = _a[0], content = _a[1];
    return {
        type: "RawInline",
        format: unwrapFormat(format),
        content: content
    };
};
var parseImage = function (n) {
    var _a = __read(n.c, 3), attr = _a[0], inline = _a[1], target = _a[2];
    return {
        type: "Image",
        attr: unwrapAttr(attr),
        content: inline.map(exports.parseInline),
        target: unwrapTarget(target)
    };
};
var parseLink = function (n) {
    var _a = __read(n.c, 3), attr = _a[0], inline = _a[1], target = _a[2];
    return {
        type: "Link",
        attr: unwrapAttr(attr),
        content: inline.map(exports.parseInline),
        target: unwrapTarget(target)
    };
};
var parseNote = function (n) {
    var blocks = n.c;
    return {
        type: "Note",
        content: blocks.map(exports.parseBlock)
    };
};
var parseSpan = function (n) {
    var _a = __read(n.c, 2), attr = _a[0], inline = _a[1];
    return {
        type: "Span",
        attr: unwrapAttr(attr),
        content: inline.map(exports.parseInline)
    };
};
exports.parseInline = function (n) {
    switch (n.t) {
        case "Str":
            return parseStr(n);
        case "Emph":
        case "Strong":
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
            return { type: n.t };
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
var parsePlain = function (n) {
    var inline = n.c;
    return {
        type: "Plain",
        content: inline.map(exports.parseInline)
    };
};
var parsePara = function (n) {
    var inline = n.c;
    return {
        type: "Para",
        content: inline.map(exports.parseInline)
    };
};
var parseLineBlock = function (n) {
    var lines = n.c;
    return {
        type: "LineBlock",
        content: lines.map(function (line) { return line.map(function (inline) { return exports.parseInline(inline); }); })
    };
};
var parseCodeBlock = function (n) {
    var _a = __read(n.c, 2), attr = _a[0], content = _a[1];
    return {
        type: "CodeBlock",
        attr: unwrapAttr(attr),
        content: content
    };
};
var parseRawBlock = function (n) {
    var _a = __read(n.c, 2), format = _a[0], content = _a[1];
    return {
        type: "RawBlock",
        format: format,
        content: content
    };
};
var parseBlockQuote = function (n) {
    var blocks = n.c;
    return {
        type: "BlockQuote",
        content: blocks.map(exports.parseBlock)
    };
};
var parseOrderedList = function (n) {
    var _a = __read(n.c, 2), listAttributes = _a[0], items = _a[1];
    return {
        type: "OrderedList",
        listAttributes: unwrapListAttributes(listAttributes),
        content: items.map(function (item) { return item.map(exports.parseBlock); })
    };
};
var parseBulletList = function (n) {
    var items = n.c;
    return {
        type: "BulletList",
        content: items.map(function (item) { return item.map(exports.parseBlock); })
    };
};
var parseDefinitionList = function (n) {
    var _a = __read(n.c, 1), items = _a[0];
    var _b = items.reduce(function (current, next) {
        var terms = current.terms, definitions = current.definitions;
        var _a = __read(next, 2), inline = _a[0], innerDefinitions = _a[1];
        return {
            terms: __spread(terms, [inline.map(exports.parseInline)]),
            definitions: __spread(definitions, [
                innerDefinitions.map(function (definition) {
                    return definition.map(exports.parseBlock);
                }),
            ])
        };
    }, { terms: [], definitions: [] }), terms = _b.terms, definitions = _b.definitions;
    return {
        type: "DefinitionList",
        terms: terms,
        definitions: definitions
    };
};
var parseHeader = function (n) {
    var _a = __read(n.c, 3), level = _a[0], attr = _a[1], inline = _a[2];
    return {
        type: "Header",
        level: level,
        attr: unwrapAttr(attr),
        content: inline.map(exports.parseInline)
    };
};
var parseDiv = function (n) {
    var _a = __read(n.c, 2), attr = _a[0], block = _a[1];
    return {
        type: "Div",
        attr: unwrapAttr(attr),
        content: block.map(exports.parseBlock)
    };
};
var parseTable = function (n) {
    var _a = __read(n.c, 5), caption = _a[0], alignments = _a[1], columnWidths = _a[2], headers = _a[3], rows = _a[4];
    return {
        type: "Table",
        caption: caption.map(exports.parseInline),
        alignments: alignments.map(function (alignment) {
            return unwrapEnum(alignment);
        }),
        columnWidths: columnWidths,
        headers: headers.map(function (blocks) { return blocks.map(exports.parseBlock); }),
        cells: rows.map(function (row) { return row.map(function (cell) { return cell.map(exports.parseBlock); }); })
    };
};
exports.parseBlock = function (n) {
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
            return { type: n.t };
        case "Div":
            return parseDiv(n);
        case "Table":
            return parseTable(n);
    }
};
exports.parsePandocJson = function (json) {
    var blocks = json.blocks, meta = json.meta;
    return {
        blocks: blocks.map(exports.parseBlock),
        meta: meta
    };
};
