import { nodes, marks } from "./schema";
import {
    PandocNode,
    Image,
    Str,
    Space,
    Header,
    LineBlock,
    ProsemirrorNode,
    Inline,
} from "../types";
import {
    textFromStrSpace,
    textToStrSpace,
    createAttr,
    intersperse,
    flatten,
} from "../transform/util";

import {
    contentTransformer,
    textTransformer,
    listTransformer,
    bareLeafTransformer,
    pandocPassThroughTransformer,
    nullTransformer,
    definitionListTransformer,
} from "../transform/commonTransformers";

import { buildRuleset, BuildRuleset } from "../transform/transformer";

const rules: BuildRuleset<PandocNode, ProsemirrorNode> = buildRuleset({
    nodes,
    marks,
});

// Do nothing with nothing
rules.fromPandoc("Null", nullTransformer);

// Paragraphs are paragraphs. So are "Plain", until proven otherwise.
rules.transform(
    "Para | Plain",
    "paragraph",
    contentTransformer("Para", "paragraph")
);

rules.fromPandoc("Div", pandocPassThroughTransformer);

// I'm not really sure what a LineBlock is, but let's just call it a single paragraph
// with some hard breaks thrown in.
rules.fromPandoc("LineBlock", (node: LineBlock, { transform }) => {
    const lines: ProsemirrorNode[][] = node.content.map(line =>
        transform(line).asArray()
    );
    return {
        type: "paragraph",
        children: flatten(
            intersperse(lines, () => ({
                type: "hard_break",
            }))
        ),
    };
});

rules.transform("CodeBlock", "code_block", textTransformer);
rules.transform("BlockQuote", "blockquote", contentTransformer);

// Use a listTransformer to take care of OrderedList and BulletList
const ensureFirstElementIsParagraph = listItem => {
    if (
        listItem.children.length === 0 ||
        listItem.children[0].type !== "paragraph"
    ) {
        listItem.children.unshift({ type: "paragraph", children: [] });
    }
    return listItem;
};

rules.transform(
    "OrderedList",
    "ordered_list",
    listTransformer("list_item", ensureFirstElementIsParagraph)
);

rules.transform(
    "BulletList",
    "bullet_list",
    listTransformer("list_item", ensureFirstElementIsParagraph)
);

rules.fromPandoc(
    "DefinitionList",
    definitionListTransformer("bullet_list", "list_item")
);

// Tranform headers
rules.transform("Header", "heading", {
    fromPandoc: (node: Header, { transform }) => {
        return {
            type: "heading",
            attrs: {
                level: node.level,
                id: node.attr.identifier,
            },
            children: transform(node.content).asArray(),
        };
    },
    fromProsemirror: (node, { transform }): Header => {
        return {
            type: "Header",
            level: parseInt(node.attrs.level.toString()),
            attr: createAttr(node.attrs.id.toString()),
            content: transform(node.children).asArray() as Inline[],
        };
    },
});

// Transform horizontal rules
rules.transform("HorizontalRule", "horizontal_rule", bareLeafTransformer);

// Specify all nodes that are equivalent to Prosemirror marks
rules.transformToMark("Emph", "em");
rules.transformToMark("Strong", "strong");
rules.transformToMark("Strikeout", "strike");
rules.transformToMark("Superscript", "sup");
rules.transformToMark("Subscript", "sub");

// We don't support small caps right now
rules.fromPandoc("SmallCaps", pandocPassThroughTransformer);

// Tell the transformer how to deal with typical content-level nodes
rules.fromPandoc("(Str | Space)+", (nodes: (Str | Space)[]) => {
    return {
        type: "text",
        text: textFromStrSpace(nodes),
    };
});

// Tell the transformer how to turn Prosemirror text back into Pandoc
rules.fromProsemirror("text", (node: ProsemirrorNode) =>
    textToStrSpace(node.text)
);

// ~~~ Rules for images ~~~ //

// rules.fromPandoc("Image", (node: Image, { resource, transform }) => {
//     return {
//         type: "image",
//         attrs: {
//             url: resource(node.target.url),
//             // TODO(ian): is there anything we can do about the image size here?
//         },
//     };
// });

rules.fromProsemirror("image", (node: ProsemirrorNode, { transform }) => {
    let caption = [];
    if (node.attrs.caption) {
        const pmDoc = JSON.parse(node.attrs.caption as string);
        const paragraphs = pmDoc.children.filter(
            child => child.type === "paragraph"
        );
        const text = flatten(paragraphs.map(para => para.children));
        caption = transform(text).asArray();
    }
    return {
        type: "Plain",
        content: [
            {
                type: "Image",
                content: caption,
                target: {
                    url: node.attrs.url.toString(),
                    title: "",
                },
                attr: createAttr(""),
            },
        ],
    };
});

export default rules.finish();
