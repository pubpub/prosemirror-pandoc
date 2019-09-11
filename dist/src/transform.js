"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var content_1 = require("prosemirror-model/src/content");
// fromPandocNode("BlockQuote", (node: BlockQuote, pm: Prosemirror) => {
//     const { content } = node;
//     return pm("blockquote").parseContent(content);
// });
// toPandocNode("blockquote", (node, pandoc) => {
//     return {
//         content: "Blockquote",
//     };
// });
var parseContentExpression = function (expr, schema) {
    return content_1.ContentMatch.parse(expr, schema);
};
var standardTransformer = function (pdNodeType, pmNodeType, transformAttrs) {
    if (transformAttrs === void 0) { transformAttrs = function (x) { return x; }; }
    var toProsemirror = function (pdNode) {
        pdNodeType;
        return __assign(__assign({ type: pmNodeType }, extractAttrs(pdNode, transformAttrs)), extractContent(pmNodeType, pmNodeType, pdNode));
    };
};
var extractAttrs = function (node, transformer) {
    if (node.attr) {
        var properties = node.attr.properties;
        return transformer(properties);
    }
    return null;
};
var extractContent = function (context, pmNodeType, pdNode, iterateLeniently) {
    if (iterateLeniently === void 0) { iterateLeniently = false; }
    var transform = context.transform, getNodeSchema = context.getNodeSchema;
    var schema = getNodeSchema(pmNodeType);
    var content = [];
    if (schema.atom) {
        return null;
    }
    var iterator = schema.createContentIterator(pdNode);
    while (iterator.nodesRemain()) {
        if (iterator.acceptsCurrentNode()) {
            var result = transform(iterator.takeCurrentNode());
            if (Array.isArray(result)) {
                content = __spread(content, result);
            }
            else {
                content.push(result);
            }
        }
        else {
            if (iterateLeniently) {
                iterator.skipCurrentNode();
            }
            else {
                break;
            }
        }
    }
    return content;
};
