import { nodes, marks } from "./schema";
import {
    Node as PandocBaseNode,
    Image,
    Plain,
    Str,
    Space,
    Header,
    HorizontalRule,
    LineBlock,
    ProsemirrorNode,
    ProsemirrorContentNode,
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
} from "../transform/basicTransformers";

import { buildRuleset, BuildRuleset } from "../transform/transformer";

const rules: BuildRuleset<PandocBaseNode, ProsemirrorNode> = buildRuleset({
    nodes,
    marks,
});

// Paragraphs are paragraphs. So are "Plain", until proven otherwise.
rules.transform(
    "Para | Plain",
    "paragraph",
    contentTransformer("Para", "paragraph")
);

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

// What even is a DefinitionList? I don't know, so we're going to turn it into a BulletList.
// rules.pandocProjection("DefinitionList", "bullet_list", {
//     before: (pandocNode: DefinitionList): BulletList => {
//         const { definitions, terms } = pandocNode;
//         const length = Math.max(definitions.length, terms.length);
//         const pandocBlocksBlocks: Block[][] = [];
//         for (let i = 0; i < length; i++) {
//             const definition = definitions[i];
//             const term = terms[i];
//             pandocBlocksBlocks.push(
//                 definition.reduce(
//                     (
//                         { hasPushedDefinition, accumulatedBlocks },
//                         definitionBlock
//                     ): {
//                         accumulatedBlocks: Block[];
//                         hasPushedDefinition: boolean;
//                     } => {
//                         if (
//                             !hasPushedDefinition &&
//                             definitionBlock &&
//                             Array.isArray(definitionBlock.content)
//                         ) {
//                             return {
//                                 accumulatedBlocks: [
//                                     ...accumulatedBlocks,
//                                     [
//                                         { type: "Emph", content: [term] },
//                                         { type: "Space" },
//                                         ...definitionBlock.content,
//                                     ],
//                                 ],
//                                 hasPushedDefinition: true,
//                             };
//                         }
//                         return {
//                             hasPushedDefinition,
//                             accumulatedBlocks: [
//                                 ...accumulatedBlocks,
//                                 definitionBlock,
//                             ],
//                         };
//                     },
//                     { hasPushedDefinition: false, accumulatedBlocks: [] }
//                 ).accumulatedBlocks
//             );
//         }
//         return {
//             type: "BulletList",
//             content: pandocBlocksBlocks,
//         };
//     },
// });

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
            content: transform(node.children)
                .asPandocInline()
                .asArray(),
        };
    },
});

// Transform horizontal rules
rules.transform("HorizontalRule", "horizontal_rule", {
    fromPandoc: () => {
        return {
            type: "horizontal_rule",
        };
    },
    fromProsemirror: (): HorizontalRule => {
        return {
            type: "HorizontalRule",
        };
    },
});

// Specify all nodes that are equivalent to Prosemirror marks
// rules.transform("Emph", "em", nodeMarkTransformer);
// rules.transform("Strong", "strong", nodeMarkTransformer);
// rules.transform("Strikeout", "strike", nodeMarkTransformer);
// rules.transform("Superscript", "sup", nodeMarkTransformer);
// rules.transform("Subscript", "sub", nodeMarkTransformer);

// We don't support small caps right now
// rules.transform("SmallCaps", passThroughTransformer);

// Tell the transformer how to deal with typical content-level nodes
rules.fromPandoc("(Str | Space)+", (nodes: (Str | Space)[]) => {
    return {
        type: "text",
        text: textFromStrSpace(nodes),
    };
});

// Tell the transformer how to turn Prosemirror text back into Pandoc
rules.fromProsemirror("text", (node: ProsemirrorContentNode) =>
    textToStrSpace(node.text)
);

// ~~~ Rules for images ~~~ //

rules.fromPandoc("Image", (node: Image, { resource, transform }) => {
    return {
        type: "paragraph",
        attrs: {
            url: resource(node.target.url),
            caption: JSON.stringify(transform(node.content).asProsemirrorDoc()),
            // TODO(ian): is there anything we can do about the image size here?
        },
    };
});

rules.fromProsemirror(
    "image",
    (
        node: ProsemirrorContentNode,
        { transform }
    ): Plain & {
        content: Image[];
    } => {
        return {
            type: "Plain",
            content: [
                {
                    type: "Image",
                    content: transform(node.children)
                        .asPandocInline()
                        .asArray(),
                    target: {
                        url: node.attrs.url.toString(),
                        title: "",
                    },
                    attr: createAttr(""),
                },
            ],
        };
    }
);

export default rules.finish();
