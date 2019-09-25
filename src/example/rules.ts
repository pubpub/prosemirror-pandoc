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
    Doc,
    Link,
    Math,
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
    tableTransformer,
} from "../transform/commonTransformers";

import { buildRuleset, BuildRuleset } from "../transform/transformer";
import { emitPandocJson } from "../emit";
import { callPandoc } from "../load";

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
    fromProsemirror: (node: ProsemirrorNode, { transform }): Header => {
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
rules.transformToMark("Code", "code");
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
rules.fromPandoc("RawBlock", pandocPassThroughTransformer);
rules.fromPandoc("RawInline", pandocPassThroughTransformer);
rules.fromPandoc("Quoted", pandocPassThroughTransformer);

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

const pandocToHtmlString = (nodes: Inline[]) => {
    if (nodes.length === 0) {
        return "";
    }
    const document: Doc = {
        blocks: [{ type: "Para", content: nodes }],
        meta: {},
    };
    const pandocJson = JSON.stringify(emitPandocJson(document));
    const htmlString = callPandoc(pandocJson, "json", "html");
    return htmlString;
};

// const htmlStringToPandoc = (htmlString: string) => {
//     if (htmlString.length === 0) {
//         return [];
//     }
//     // TODO(ian): Implement this!
//     // const pandocAst = parsePandocJson(
//     //     JSON.parse(callPandoc(htmlString, "html", "json"))
//     // );
//     return [];
// };

rules.fromPandoc("Image", (node: Image, { resource }) => {
    return {
        type: "image",
        attrs: {
            url: resource(node.target.url),
            caption: pandocToHtmlString(node.content),
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

export default rules.finish();
