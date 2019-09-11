import { nodes, marks } from "./schema";
import { Image, Plain } from "../types";
import {
    textFromStrSpace,
    textToStrSpace,
    createAttr,
} from "../transform/util";

const transformer = makeTransformer({ nodes, marks });

// Specify all nodes that are equivalent to Prosemirror marks
transformer.equateToMark("Emph", "em");
transformer.equateToMark("Strong", "strong");
transformer.equateToMark("Strikeout", "strike");
transformer.equateToMark("Superscript", "sup");
transformer.equateToMark("Subscript", "sub");

// We don't support small caps right now
transformer.passThrough("SmallCaps");

// Tell the transformer how to deal with typical content-level nodes
transformer.pandocRule("(Str | Space)+", nodes => {
    return {
        type: "text",
        text: textFromStrSpace(nodes),
    };
});

// Tell the transformer how to turn Prosemirror text back into Pandoc
transformer.prosemirrorRule("text", node => textToStrSpace(node.text));

// ~~~ Rules for images ~~~ //

transformer.pandocRule(
    "Image",
    { maySplitGroup: true },
    (node: Image, { resource, fromPandoc }) => {
        return {
            type: "image",
            attrs: {
                url: resource(node.target.url),
                caption: JSON.stringify(fromPandoc(node.content)),
                // TODO(ian): is there anything we can do about the image size here?
            },
        };
    }
);

transformer.prosemirrorRule("image", (node, { fromProsemirror }): Plain & {
    content: Image[];
} => {
    return {
        type: "Plain",
        content: [
            {
                type: "Image",
                content: fromProsemirror(node.content),
                target: {
                    url: node.attrs.url,
                    title: "",
                },
                attr: createAttr(),
            },
        ],
    };
});