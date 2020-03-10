import * as katex from "katex";

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
    Link,
    Math,
    Note,
    Cite,
    Code,
    CodeBlock,
    RawInline,
    RawBlock,
} from "../types";

import {
    textFromStrSpace,
    textToStrSpace,
    createAttr,
    intersperse,
    flatten,
} from "../transform/util";

import {
    bareLeafTransformer,
    contentTransformer,
    definitionListTransformer,
    docTransformer,
    listTransformer,
    nullTransformer,
    pandocPassThroughTransformer,
    tableTransformer,
} from "../transform/commonTransformers";

import { buildRuleset, BuildRuleset } from "../transform/transformer";

import {
    pandocInlineToHtmlString,
    htmlStringToPandocInline,
    pandocBlocksToHtmlString,
    htmlStringToPandocBlocks,
} from "./util";

const rules: BuildRuleset<PandocNode, ProsemirrorNode> = buildRuleset({
    nodes,
    marks,
});

// Top-level transformer for a doc
rules.transform("Doc", "doc", docTransformer);

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
        content: flatten(
            intersperse(lines, () => ({
                type: "hard_break",
            }))
        ),
    };
});

rules.transform("CodeBlock", "code_block", {
    fromPandoc: (node: CodeBlock) => {
        return {
            type: "code_block",
            content: [{ type: "text", text: node.content }],
        };
    },
    fromProsemirror: (node: ProsemirrorNode): CodeBlock => {
        return {
            type: "CodeBlock",
            content: node.content.map(text => text.text).join(""),
            attr: createAttr(""),
        };
    },
});

rules.transform("BlockQuote", "blockquote", contentTransformer);

// Use a listTransformer to take care of OrderedList and BulletList
const ensureFirstElementIsParagraph = listItem => {
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
            content: transform(node.content).asArray(),
        };
    },
    fromProsemirror: (node: ProsemirrorNode, { transform }): Header => {
        return {
            type: "Header",
            level: parseInt(node.attrs.level.toString()),
            attr: createAttr(node.attrs.id.toString()),
            content: transform(node.content).asArray() as Inline[],
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

rules.fromPandoc("Code", (node: Code) => {
    return {
        type: "text",
        marks: [{ type: "code" }],
        text: node.content,
    };
});

rules.transformToMark("Link", "link", (link: Link) => {
    return {
        href: link.target.url,
        title: link.target.title,
    };
});

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

// Deal with line breaks
rules.transform("LineBreak", "hard_break", bareLeafTransformer);
rules.fromPandoc("SoftBreak", nullTransformer);

// Stuff we don't have equivalents for
rules.fromPandoc("Span", pandocPassThroughTransformer);
rules.fromPandoc("Quoted", pandocPassThroughTransformer);

rules.fromPandoc("RawBlock", (node: RawBlock) => {
    return {
        type: "paragraph",
        content: [{ type: "text", text: node.content }],
    };
});

rules.fromPandoc("RawInline", (node: RawInline) => {
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

// Tables
rules.transform("Table", "table", tableTransformer);

// Equations
rules.fromPandoc("Math", (node: Math) => {
    const { mathType, content } = node;
    const isDisplay = mathType === "DisplayMath";
    const prosemirrorType = isDisplay ? "block_equation" : "equation";
    return {
        type: prosemirrorType,
        attrs: {
            value: content,
            html: katex.renderToString(content, {
                displayMode: isDisplay,
                throwOnError: false,
            }),
        },
    };
});

// ~~~ Rules for images ~~~ //

rules.fromPandoc("Image", (node: Image, { resource }) => {
    return {
        type: "image",
        attrs: {
            url: resource(node.target.url),
            caption: pandocInlineToHtmlString(node.content),
            // TODO(ian): is there anything we can do about the image size here?
        },
    };
});

rules.fromProsemirror("image", (node: ProsemirrorNode) => {
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

// ~~~ Rules for citations and footnotes ~~~ //

rules.transform("Cite", "citation", {
    fromPandoc: (node: Cite, { count }) => {
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
    fromProsemirror: (node: ProsemirrorNode) => {
        const inputHtml = (node.attrs.html ||
            node.attrs.unstructuredValue) as string;
        const citationNumber =
            typeof node.attrs.count === "number"
                ? node.attrs.count
                : parseInt(node.attrs.count);
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
    fromPandoc: (node: Note, { count }) => {
        const { content } = node;
        return {
            type: "footnote",
            attrs: {
                unstructuredValue: pandocBlocksToHtmlString(content),
                count: 1 + count("Note"),
            },
        };
    },
    fromProsemirror: (node: ProsemirrorNode) => {
        const noteContent = (node.attrs.unstructuredValue || "") as string;
        return {
            type: "Note",
            content: htmlStringToPandocBlocks(noteContent),
        };
    },
});

export default rules.finish();
