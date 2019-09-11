import { nodes, marks } from "./schema";
import { Image, Plain, DefinitionList, Emph } from "../src/types";
import { LineBlock } from "../src/types";
import {
    textFromStrSpace,
    textToStrSpace,
    createAttr,
    intersperse,
} from "../src/transform/util";

import {
    listTransformer,
    contentTransformer,
    textTransformer,
    nodeMarkTransformer,
} from "../src/transform/basicTransformers";

const transformer = makeTransformer({ nodes, marks });

// Paragraphs are paragraphs.
transformer.transform("Para", "paragraph", contentTransformer);

// Deal with Plain nodes. We don't really have a thing for these, so pretend they're paragraphs.
// By specifiying a pandocProjection, we're telling the converter to use the transformer registered
// to create paragraphs.
transformer.pandocProjection("Plain", "paragraph");

// I'm not really sure what a LineBlock is, but let's just call it a single paragraph
// with some hard breaks thrown in.
transformer.pandocProjection("LineBlock", "paragraph", {
    after: prosemirrorNode => ({
        ...prosemirrorNode,
        children: intersperse(prosemirrorNode.children, () => {
            "hard_break";
        }),
    }),
});

// Fantastic, we have a one-to-one for this
transformer.transform("CodeBlock", "code_block", textTransformer);

// I am not sure how to handle a RawBlock. For now, let's put its content into a code_block
// and see how bad it gets.
transformer.pandocProjection("RawBlock", "code_block");

// Use a one-to-one for Blockquote <-> blockquote
transformer.transform("BlockQuote", "blockquote", contentTransformer);

// Use a listTransformer to take care of OrderedList
transformer.transform(
    "OrderedList",
    "ordered_list",
    listTransformer("list_item")
);

// Same with BulletList!
transformer.transform(
    "BulletList",
    "bullet_list",
    listTransformer("list_item")
);

// What even is a DefinitionList? I don't know, so we're going to turn it into a BulletList.
transformer.pandocProjection("DefinitionList", "bullet_list", {
    before: (pandocNode: DefinitionList) => {
        const { definitions, terms } = pandocNode;
        const length = Math.max(definitions.length, terms.length);
        const pandocBlocks = [];
        for (let i = 0; i < length; i++) {
            const definition = [...definitions[i]];
            const term = terms[i];
            const emphTerm: Emph = { type: "Emph", content: [term] };
            let firstBlockInDefinition = definition[0];
            if (!firstBlockInDefinition) {
                firstBlockInDefinition = { type: "Plain", content: [] };
                definition.push(firstBlockInDefinition);
            }
            firstBlockInDefinition.content.push(emphTerm);
        }
    },
});

// Specify all nodes that are equivalent to Prosemirror marks
transformer.transform("Emph", "em", nodeMarkTransformer);
transformer.transform("Strong", "strong", nodeMarkTransformer);
transformer.transform("Strikeout", "strike", nodeMarkTransformer);
transformer.transform("Superscript", "sup", nodeMarkTransformer);
transformer.transform("Subscript", "sub", nodeMarkTransformer);

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

transformer.pandocRule("Image", (node: Image, { resource, fromPandoc }) => {
    return {
        type: "image",
        attrs: {
            url: resource(node.target.url),
            caption: JSON.stringify(fromPandoc(node.content)),
            // TODO(ian): is there anything we can do about the image size here?
        },
    };
});

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
