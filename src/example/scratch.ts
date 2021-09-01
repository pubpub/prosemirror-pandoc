import * as katex from "katex";

import { Inline } from "types";
import {
    bareMarkTransformer,
    docTransformer,
    nullTransformer,
    bareContentTransformer,
    pandocPassThroughTransformer,
    createListTransformer,
    definitionListTransformer,
    bareLeafTransformer,
    pandocQuotedTransformer,
} from "transform/transformers";
import {
    createAttr,
    flatten,
    intersperse,
    textFromStrSpace,
    textToStrSpace,
} from "transform/util";
import { RuleSet } from "transform/ruleset";

import { prosemirrorSchema } from "./schema";
import {
    htmlStringToPandocBlocks,
    htmlStringToPandocInline,
    pandocBlocksToHtmlString,
    pandocInlineToHtmlString,
} from "./util";

const rules = new RuleSet(prosemirrorSchema);

// Top-level transformer for a doc
rules.transform("Doc", "doc", docTransformer);

// Do nothing with nothing
rules.toProsemirrorNode("Null", nullTransformer);

// Paragraphs are paragraphs. So are "Plain", until proven otherwise.
rules.transform(
    "Para | Plain",
    "paragraph",
    bareContentTransformer("Para", "paragraph")
);

// Divs are just boxes of other content
rules.toProsemirrorNode("Div", pandocPassThroughTransformer);

// I'm not really sure what a LineBlock is, but let's just call it a single paragraph
// with some hard breaks thrown in.
rules.toProsemirrorNode("LineBlock", (node, { transform }) => {
    const lines = node.content.map((line) => transform(line).asArray());
    return {
        type: "paragraph",
        content: flatten(
            intersperse(lines, () => ({
                type: "hard_break",
            }))
        ),
    };
});

rules.transform("CodeBlock", "code_block", {
    toProsemirrorNode: (node) => {
        return {
            type: "code_block",
            content: [{ type: "text", text: node.content }],
        };
    },
    fromProsemirrorNode: (node) => {
        return {
            type: "CodeBlock",
            content: node.content.map((text) => text.text).join(""),
            attr: createAttr(""),
        };
    },
});

rules.transform("BlockQuote", "blockquote", bareContentTransformer);

// Use a listTransformer to take care of OrderedList and BulletList
const ensureFirstElementIsParagraph = (listItem) => {
    if (
        listItem.content.length === 0 ||
        listItem.content[0].type !== "paragraph"
    ) {
        listItem.content.unshift({ type: "paragraph", content: [] });
    }
    return listItem;
};

rules.transform(
    "OrderedList",
    "ordered_list",
    createListTransformer("list_item", ensureFirstElementIsParagraph)
);

rules.transform(
    "BulletList",
    "bullet_list",
    createListTransformer("list_item", ensureFirstElementIsParagraph)
);

rules.toProsemirrorNode(
    "DefinitionList",
    definitionListTransformer("bullet_list", "list_item")
);

// Tranform headers
rules.transform("Header", "heading", {
    toProsemirrorNode: (node, { transform }) => {
        return {
            type: "heading",
            attrs: {
                level: node.level,
                id: node.attr.identifier,
            },
            content: transform(node.content).asArray(),
        };
    },
    fromProsemirrorNode: (node, { transform }) => {
        return {
            type: "Header",
            level: parseInt(node.attrs.level.toString()),
            attr: createAttr(node.attrs.id.toString()),
            content: transform(node.content).asArray() as Inline[],
        };
    },
});

rules.transform("HorizontalRule", "horizontal_rule", bareLeafTransformer);

const bareMarkTransformPairs = [
    ["Strong", "strong"],
    ["Emph", "em"],
    ["Strikeout", "strike"],
    ["Superscript", "sup"],
    ["Code", "sub"],
] as const;

bareMarkTransformPairs.forEach(([from, to]) =>
    rules.transform(from, to, bareMarkTransformer)
);

rules.transform("Link", "link", {
    toProsemirrorMark: (link) => {
        return {
            type: "link",
            attrs: {
                href: link.target.url,
                title: link.target.title,
            },
        };
    },
    fromProsemirrorMark: (link, content) => {
        return {
            type: "Link",
            attr: createAttr(),
            content,
            target: {
                url: link.attrs.href.toString(),
                title: link.attrs.title.toString(),
            },
        };
    },
});

// We don't support small caps right now
rules.toProsemirrorNode("SmallCaps", pandocPassThroughTransformer);

// Tell the transformer how to deal with typical content-level nodes
rules.toProsemirrorNode("(Str | Space)+", (nodes) => {
    return {
        type: "text",
        text: textFromStrSpace(nodes),
    };
});

// Tell the transformer how to turn Prosemirror text back into Pandoc
rules.fromProsemirrorNode("text", (node) => textToStrSpace(node.text));

// Deal with line breaks
rules.transform("LineBreak", "hard_break", bareLeafTransformer);
rules.toProsemirrorNode("SoftBreak", nullTransformer);

// Stuff we don't have equivalents for
rules.toProsemirrorNode("Span", pandocPassThroughTransformer);
rules.toProsemirrorNode("Underline", pandocPassThroughTransformer);

// Anything in quotation marks is its own node, to Pandoc
rules.toProsemirrorNode("Quoted", pandocQuotedTransformer);

rules.toProsemirrorNode("RawBlock", (node) => {
    return {
        type: "paragraph",
        content: [{ type: "text", text: node.content }],
    };
});

rules.toProsemirrorNode("RawInline", (node) => {
    const { format, content } = node;
    if (format === "tex") {
        return {
            type: "equation",
            attrs: {
                value: content,
                html: katex.renderToString(content, {
                    displayMode: false,
                    throwOnError: false,
                }),
            },
        };
    }
    return { type: "text", text: content };
});

// These next rules for images don't use transform() because they're not inverses of each other --
// the Prosemirror->Pandoc direction wraps an Image in a Plain to make it block-level

rules.toProsemirrorNode("Image", (node, { resource }) => {
    return {
        type: "image",
        attrs: {
            url: resource(node.target.url),
            caption: pandocInlineToHtmlString(node.content),
            // TODO(ian): is there anything we can do about the image size here?
        },
    };
});

rules.fromProsemirrorNode("image", (node) => {
    return {
        type: "Plain",
        content: [
            {
                type: "Image",
                content: [],
                target: {
                    url: node.attrs.url.toString(),
                    title: "",
                },
                attr: createAttr(""),
            },
        ],
    };
});

rules.transform("Cite", "citation", {
    toProsemirrorNode: (node, { count }) => {
        const { content } = node;
        const unstructuredValue = pandocInlineToHtmlString(content);
        return {
            type: "citation",
            attrs: {
                unstructuredValue,
                count: 1 + count("Cite"),
            },
        };
    },
    fromProsemirrorNode: (node) => {
        const inputHtml = (node.attrs.html ||
            node.attrs.unstructuredValue) as string;
        const citationNumber =
            typeof node.attrs.count === "number"
                ? node.attrs.count
                : parseInt(node.attrs.count as string);
        return {
            type: "Cite",
            content: htmlStringToPandocInline(inputHtml),
            citations: [
                {
                    citationId: "",
                    citationPrefix: [],
                    citationSuffix: [],
                    citationNoteNum: citationNumber,
                    citationHash: citationNumber,
                    citationMode: "NormalCitation",
                },
            ],
        };
    },
});

rules.transform("Note", "footnote", {
    toProsemirrorNode: (node, { count }) => {
        const { content } = node;
        return {
            type: "footnote",
            attrs: {
                unstructuredValue: pandocBlocksToHtmlString(content),
                count: 1 + count("Note"),
            },
        };
    },
    fromProsemirrorNode: (node) => {
        const noteContent = (node.attrs.unstructuredValue || "") as string;
        return {
            type: "Note",
            content: htmlStringToPandocBlocks(noteContent),
        };
    },
});

export { rules };
