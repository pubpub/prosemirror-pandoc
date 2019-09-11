"use strict";
exports.__esModule = true;
var schema_1 = require("./schema");
var util_1 = require("../transform/util");
var transformer = makeTransformer({ nodes: schema_1.nodes, marks: schema_1.marks });
// Specify all nodes that are equivalent to Prosemirror marks
transformer.equateToMark("Emph", "em");
transformer.equateToMark("Strong", "strong");
transformer.equateToMark("Strikeout", "strike");
transformer.equateToMark("Superscript", "sup");
transformer.equateToMark("Subscript", "sub");
// We don't support small caps right now
transformer.passThrough("SmallCaps");
// Tell the transformer how to deal with typical content-level nodes
transformer.pandocRule("(Str | Space)+", function (nodes) {
    return {
        type: "text",
        text: util_1.textFromStrSpace(nodes)
    };
});
// Tell the transformer how to turn Prosemirror text back into Pandoc
transformer.prosemirrorRule("text", function (node) { return util_1.textToStrSpace(node.text); });
// ~~~ Rules for images ~~~ //
transformer.pandocRule("Image", { maySplitGroup: true }, function (node, _a) {
    var resource = _a.resource, fromPandoc = _a.fromPandoc;
    return {
        type: "image",
        attrs: {
            url: resource(node.target.url),
            caption: JSON.stringify(fromPandoc(node.content))
        }
    };
});
transformer.prosemirrorRule("image", function (node, _a) {
    var fromProsemirror = _a.fromProsemirror;
    return {
        type: "Plain",
        content: [
            {
                type: "Image",
                content: fromProsemirror(node.content),
                target: {
                    url: node.attrs.url,
                    title: ""
                },
                attr: util_1.createAttr()
            },
        ]
    };
});
