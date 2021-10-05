/* global describe, it, expect */
import {
    Header,
    OrderedList,
    BulletList,
    Div,
    Para,
    Plain,
    DefinitionList,
    Link,
} from "types";
import { rules } from "example/rules";
import { createAttr } from "transform/util";

import { fromPandoc } from "../fromPandoc";

describe("fromPandoc", () => {
    it("transforms a Doc into a doc", () => {
        expect(
            fromPandoc(
                {
                    type: "Doc",
                    meta: {},
                    blocks: [
                        {
                            type: "Para",
                            content: [
                                { type: "Str", content: "Hello" },
                                { type: "Space" },
                                { type: "Str", content: "dad!" },
                            ],
                        },
                        {
                            type: "Para",
                            content: [
                                { type: "Str", content: "Hello" },
                                { type: "Space" },
                                { type: "Str", content: "mom!" },
                            ],
                        },
                        {
                            type: "Para",
                            content: [
                                {
                                    type: "Str",
                                    content: "Ch-ch-ch-ch-ch-cherry",
                                },
                                { type: "Space" },
                                { type: "Str", content: "bomb!" },
                            ],
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Hello dad!" }],
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Hello mom!" }],
                },
                {
                    type: "paragraph",
                    content: [
                        { type: "text", text: "Ch-ch-ch-ch-ch-cherry bomb!" },
                    ],
                },
            ],
        });
    });

    it("transforms a Null into an empty array", () => {
        expect(fromPandoc({ type: "Null" }, rules).asArray()).toEqual([]);
    });

    it("transforms a simple string", () => {
        expect(
            fromPandoc(
                [
                    { type: "Str", content: "Hello" },
                    { type: "Space" },
                    { type: "Str", content: "world!" },
                ],
                rules
            ).asNode()
        ).toEqual({ type: "text", text: "Hello world!" });
    });

    it("transforms multiple paragraphs", () => {
        expect(
            fromPandoc(
                [
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Hello" },
                            { type: "Space" },
                            { type: "Str", content: "dad!" },
                        ],
                    },
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Hello" },
                            { type: "Space" },
                            { type: "Str", content: "mom!" },
                        ],
                    },
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Ch-ch-ch-ch-ch-cherry" },
                            { type: "Space" },
                            { type: "Str", content: "bomb!" },
                        ],
                    },
                ],
                rules
            ).asArray()
        ).toEqual([
            {
                type: "paragraph",
                content: [{ type: "text", text: "Hello dad!" }],
            },
            {
                type: "paragraph",
                content: [{ type: "text", text: "Hello mom!" }],
            },
            {
                type: "paragraph",
                content: [
                    { type: "text", text: "Ch-ch-ch-ch-ch-cherry bomb!" },
                ],
            },
        ]);
    });

    it("transforms a Para, Plain, or Div into a paragraph", () => {
        const blockOne: Para = {
            type: "Para",
            content: [
                { type: "Str", content: "Hello" },
                { type: "Space" },
                { type: "Str", content: "world!" },
            ],
        };
        const blockTwo: Plain = {
            type: "Plain",
            content: [
                { type: "Str", content: "Hello" },
                { type: "Space" },
                { type: "Str", content: "world!" },
            ],
        };
        const blockThree: Div = {
            type: "Div",
            attr: createAttr(""),
            content: [
                {
                    type: "Para",
                    content: [
                        { type: "Str", content: "Hello" },
                        { type: "Space" },
                        { type: "Str", content: "world!" },
                    ],
                },
            ],
        };
        [blockOne, blockTwo, blockThree].forEach((block) =>
            expect(fromPandoc(block, rules).asNode()).toEqual({
                type: "paragraph",
                content: [{ type: "text", text: "Hello world!" }],
            })
        );
    });

    it("transforms a LineBlock into a paragraph", () => {
        expect(
            fromPandoc(
                {
                    type: "LineBlock",
                    content: [
                        [
                            { type: "Str", content: "Hello" },
                            { type: "Space" },
                            { type: "Str", content: "world!" },
                        ],
                        [
                            { type: "Str", content: "I'm" },
                            { type: "Space" },
                            { type: "Str", content: "testing!" },
                        ],
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "paragraph",
            content: [
                { type: "text", text: "Hello world!" },
                { type: "hard_break" },
                { type: "text", text: "I'm testing!" },
            ],
        });
    });

    it("transforms a CodeBlock into a code_block", () => {
        expect(
            fromPandoc(
                {
                    type: "CodeBlock",
                    content: "hello_world()",
                    attr: createAttr(""),
                },
                rules
            ).asNode()
        ).toEqual({
            type: "code_block",
            content: [{ type: "text", text: "hello_world()" }],
        });
    });

    it("transforms a BlockQuote into a blockquote", () => {
        expect(
            fromPandoc(
                {
                    type: "BlockQuote",
                    content: [
                        {
                            type: "Para",
                            content: [
                                { type: "Str", content: "Lorem" },
                                { type: "Space" },
                                { type: "Str", content: "Ipsum?" },
                            ],
                        },
                        {
                            type: "Para",
                            content: [
                                { type: "Str", content: "More" },
                                { type: "Space" },
                                { type: "Str", content: "like" },
                                { type: "Space" },
                                { type: "Str", content: "Borem" },
                                { type: "Space" },
                                { type: "Str", content: "Ipsum!" },
                            ],
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "blockquote",
            content: [
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "Lorem Ipsum?" }],
                },
                {
                    type: "paragraph",
                    content: [{ type: "text", text: "More like Borem Ipsum!" }],
                },
            ],
        });
    });

    it("transforms a Header into a heading", () => {
        const header: Header = {
            type: "Header",
            attr: createAttr("lesson-one", [], {}),
            level: 1,
            content: [
                { type: "Str", content: "Lesson" },
                { type: "Space" },
                { type: "Str", content: "One" },
            ],
        };
        expect(fromPandoc(header, rules).asNode()).toEqual({
            type: "heading",
            attrs: {
                level: 1,
                id: "lesson-one",
            },
            content: [{ type: "text", text: "Lesson One" }],
        });
    });

    it("transforms a HorizontalRule into a horizontal_rule", () => {
        expect(fromPandoc({ type: "HorizontalRule" }, rules).asNode()).toEqual({
            type: "horizontal_rule",
        });
    });

    it("transforms an OrderedList into an ordered_list", () => {
        const input: OrderedList = {
            type: "OrderedList",
            listAttributes: {
                startNumber: 2,
                listNumberDelim: "DefaultDelim",
                listNumberStyle: "DefaultStyle",
            },
            content: [
                [
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Item" },
                            { type: "Space" },
                            { type: "Str", content: "One" },
                        ],
                    },
                ],
                [
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Item" },
                            { type: "Space" },
                            { type: "Str", content: "Two" },
                        ],
                    },
                ],
                [
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Item" },
                            { type: "Space" },
                            { type: "Str", content: "Three" },
                        ],
                    },
                ],
            ],
        };
        const expectedOutput = {
            type: "ordered_list",
            attrs: {
                order: 2,
            },
            content: [
                {
                    type: "list_item",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item One" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item Two" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item Three" }],
                        },
                    ],
                },
            ],
        };
        expect(fromPandoc(input, rules).asNode()).toEqual(expectedOutput);
    });

    it("transforms a DefinitionList into a bullet_list", () => {
        const input: DefinitionList = {
            type: "DefinitionList",
            entries: [
                {
                    term: [
                        { type: "Str", content: "A" },
                        { type: "Space" },
                        { type: "Str", content: "term" },
                    ],
                    definitions: [
                        [
                            {
                                type: "Para",
                                content: [
                                    { type: "Str", content: "Definition" },
                                    { type: "Space" },
                                    { type: "Str", content: "One" },
                                ],
                            },
                            {
                                type: "Para",
                                content: [
                                    { type: "Str", content: "Paragraph" },
                                    { type: "Space" },
                                    { type: "Str", content: "B" },
                                ],
                            },
                        ],
                        [
                            {
                                type: "BlockQuote",
                                content: [
                                    {
                                        type: "Para",
                                        content: [
                                            {
                                                type: "Str",
                                                content: "Inside",
                                            },
                                            { type: "Space" },
                                            {
                                                type: "Str",
                                                content: "Blockquote",
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: "Para",
                                content: [
                                    { type: "Str", content: "Paragraph" },
                                    { type: "Space" },
                                    { type: "Str", content: "D" },
                                ],
                            },
                        ],
                    ],
                },
                {
                    term: [{ type: "Str", content: "Mercifully" }],
                    definitions: [
                        [
                            {
                                type: "Para",
                                content: [{ type: "Str", content: "simple." }],
                            },
                        ],
                    ],
                },
            ],
        };
        expect(fromPandoc(input, rules).asArray()).toMatchSnapshot();
    });

    it("transforms a BulletList into a bullet_list", () => {
        const input: BulletList = {
            type: "BulletList",
            content: [
                [
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Item" },
                            { type: "Space" },
                            { type: "Str", content: "One" },
                        ],
                    },
                ],
                [
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Item" },
                            { type: "Space" },
                            { type: "Str", content: "Two" },
                        ],
                    },
                ],
                [
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Item" },
                            { type: "Space" },
                            { type: "Str", content: "Three" },
                        ],
                    },
                ],
            ],
        };
        const expectedOutput = {
            type: "bullet_list",
            attrs: {},
            content: [
                {
                    type: "list_item",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item One" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item Two" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item Three" }],
                        },
                    ],
                },
            ],
        };
        expect(fromPandoc(input, rules).asNode()).toEqual(expectedOutput);
    });

    it("uses the processListItem argument of listTransformer to process list items", () => {
        // The PubPub prosemirror schema demands that the first element in a list_item
        // be a paragraph. We enforce that using a processListItem function, which we test here.
        const input: BulletList = {
            type: "BulletList",
            content: [
                [
                    {
                        type: "Para",
                        content: [
                            { type: "Str", content: "Item" },
                            { type: "Space" },
                            { type: "Str", content: "One" },
                        ],
                    },
                ],
                [
                    {
                        type: "BlockQuote",
                        content: [
                            {
                                type: "Para",
                                content: [
                                    { type: "Str", content: "Item" },
                                    { type: "Space" },
                                    { type: "Str", content: "Two" },
                                ],
                            },
                        ],
                    },
                ],
            ],
        };
        const expectedOutput = {
            type: "bullet_list",
            attrs: {},
            content: [
                {
                    type: "list_item",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "Item One" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    content: [
                        // This is the added paragraph we expect to see.
                        { type: "paragraph", content: [] },
                        {
                            type: "blockquote",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [
                                        { type: "text", text: "Item Two" },
                                    ],
                                },
                            ],
                        },
                    ],
                },
            ],
        };
        expect(fromPandoc(input, rules).asNode()).toEqual(expectedOutput);
    });

    it("uses the pandocPassThroughTransformer to ignore SmallCaps", () => {
        expect(
            fromPandoc(
                {
                    type: "Para",
                    content: [
                        {
                            type: "Str",
                            content: "Hello,",
                        },
                        { type: "Space" },
                        {
                            type: "SmallCaps",
                            content: [
                                { type: "Str", content: "small" },
                                { type: "Space" },
                                { type: "Str", content: "caps" },
                            ],
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "paragraph",
            content: [
                { type: "text", text: "Hello, " },
                { type: "text", text: "small caps" },
            ],
        });
    });

    it("performs a simple transformation from nodes to Prosemirror marks", () => {
        expect(
            fromPandoc(
                {
                    type: "Para",
                    content: [
                        {
                            type: "Strong",
                            content: [
                                { type: "Str", content: "Hello" },
                                { type: "Space" },
                                { type: "Str", content: "world!" },
                            ],
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "paragraph",
            content: [
                {
                    type: "text",
                    marks: [{ type: "strong" }],
                    text: "Hello world!",
                },
            ],
        });
    });

    it("transforms nested inline nodes into multiple Prosemirror marks", () => {
        expect(
            fromPandoc(
                {
                    type: "Para",
                    content: [
                        {
                            type: "Emph",
                            content: [
                                {
                                    type: "Strong",
                                    content: [
                                        { type: "Str", content: "Hello" },
                                        { type: "Space" },
                                        { type: "Str", content: "world!" },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "paragraph",
            content: [
                {
                    type: "text",
                    marks: [{ type: "strong" }, { type: "em" }],
                    text: "Hello world!",
                },
            ],
        });
    });

    it("ignores doubly-nested marks", () => {
        expect(
            fromPandoc(
                {
                    type: "Para",
                    content: [
                        {
                            type: "Emph",
                            content: [
                                {
                                    type: "Strong",
                                    content: [
                                        {
                                            type: "Emph",
                                            content: [
                                                {
                                                    type: "Str",
                                                    content: "Hello",
                                                },
                                                { type: "Space" },
                                                {
                                                    type: "Str",
                                                    content: "world!",
                                                },
                                            ],
                                        },
                                        {
                                            type: "Str",
                                            content: "Hello",
                                        },
                                        { type: "Space" },
                                        {
                                            type: "Str",
                                            content: "again!",
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "paragraph",
            content: [
                {
                    type: "text",
                    marks: [{ type: "em" }, { type: "strong" }],
                    text: "Hello world!",
                },
                {
                    type: "text",
                    marks: [{ type: "strong" }, { type: "em" }],
                    text: "Hello again!",
                },
            ],
        });
    });

    it("handles a complicated nodes -> marks nesting situation", () => {
        expect(
            fromPandoc(
                [
                    {
                        type: "Para",
                        content: [
                            {
                                type: "Strong",
                                content: [
                                    {
                                        type: "Subscript",
                                        content: [
                                            {
                                                type: "Str",
                                                content: "Hello",
                                            },
                                        ],
                                    },
                                    { type: "Space" },
                                    { type: "Str", content: "world!" },
                                ],
                            },
                        ],
                    },
                    {
                        type: "BlockQuote",
                        content: [
                            {
                                type: "Para",
                                content: [
                                    {
                                        type: "Strikeout",
                                        content: [
                                            { type: "Str", content: "What's" },
                                            { type: "Space" },
                                            {
                                                type: "Emph",
                                                content: [
                                                    {
                                                        type: "Str",
                                                        content: "up?",
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                ],
                rules
            ).asArray()
        ).toEqual([
            {
                type: "paragraph",
                content: [
                    {
                        type: "text",
                        marks: [{ type: "sub" }, { type: "strong" }],
                        text: "Hello",
                    },
                    {
                        type: "text",
                        marks: [{ type: "strong" }],
                        text: " world!",
                    },
                ],
            },
            {
                type: "blockquote",
                content: [
                    {
                        type: "paragraph",
                        content: [
                            {
                                type: "text",
                                marks: [{ type: "strike" }],
                                text: "What's ",
                            },
                            {
                                type: "text",
                                marks: [{ type: "em" }, { type: "strike" }],
                                text: "up?",
                            },
                        ],
                    },
                ],
            },
        ]);
    });

    it("gracefully handles marks that cannot be applied", () => {
        expect(
            fromPandoc(
                // This is incorrectly typed -- that's okay
                {
                    type: "Strong",
                    // @ts-ignore
                    content: [{ type: "HorizontalRule" }],
                },
                rules
            ).asNode()
        ).toEqual({ type: "horizontal_rule" });
    });

    it("transforms Links", () => {
        const link: Link = {
            type: "Link",
            attr: createAttr(""),
            target: {
                url: "https://example.com",
                title: "Hi!",
            },
            content: [{ type: "Str", content: "Hey!" }],
        };
        expect(fromPandoc(link, rules).asNode()).toEqual({
            type: "text",
            marks: [
                {
                    type: "link",
                    attrs: { href: "https://example.com", title: "Hi!" },
                },
            ],
            text: "Hey!",
        });
    });

    it("handles an Image with alt text that needs to be converted by Pandoc", () => {
        expect(
            fromPandoc(
                {
                    type: "Image",
                    target: {
                        url: "https://pubpub.org/logo.png",
                        title: "The PubPub logo",
                    },
                    attr: createAttr(""),
                    content: [
                        {
                            type: "Strong",
                            content: [{ type: "Str", content: "Very" }],
                        },
                        { type: "Space" },
                        { type: "Str", content: "cool." },
                    ],
                },
                rules,
                { resources: { image: (x) => x.replace("pubpub", "duqduq") } }
            ).asNode()
        ).toEqual({
            type: "image",
            attrs: {
                altText: "Very cool.",
                url: "https://duqduq.org/logo.png",
            },
        });
    });

    it("transforms a Table", () => {
        expect(
            fromPandoc(
                {
                    type: "Table",
                    attr: {
                        identifier: "",
                        classes: [],
                        properties: {},
                    },
                    caption: {
                        type: "Caption",
                        content: [
                            {
                                type: "Plain",
                                content: [
                                    {
                                        type: "Str",
                                        content: "He-Man",
                                    },
                                    {
                                        type: "Space",
                                    },
                                    {
                                        type: "Str",
                                        content: "and",
                                    },
                                    {
                                        type: "Space",
                                    },
                                    {
                                        type: "Str",
                                        content: "Skeletor",
                                    },
                                    {
                                        type: "Space",
                                    },
                                    {
                                        type: "Str",
                                        content: "facts",
                                    },
                                ],
                            },
                        ],
                    },
                    colSpecs: [
                        {
                            type: "ColSpec",
                            alignment: "AlignDefault",
                            width: 0.3,
                        },
                        {
                            type: "ColSpec",
                            alignment: "AlignDefault",
                            width: 0.7,
                        },
                    ],
                    head: {
                        type: "TableHead",
                        attr: {
                            identifier: "",
                            classes: [],
                            properties: {},
                        },
                        rows: [],
                    },
                    bodies: [
                        {
                            type: "TableBody",
                            rowHeadColumns: 1,
                            attr: {
                                identifier: "",
                                classes: [],
                                properties: {},
                            },
                            headRows: [],
                            bodyRows: [
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: ["heman"],
                                                properties: {
                                                    scope: "col",
                                                },
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "He-Man",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {
                                                    scope: "row",
                                                },
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Role",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Hero",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {
                                                    scope: "row",
                                                },
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Weapon",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Power",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "Sword",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {
                                                    scope: "row",
                                                },
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Dark",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "secret",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Expert",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "florist",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    foot: {
                        type: "TableFoot",
                        attr: {
                            identifier: "",
                            classes: [],
                            properties: {},
                        },
                        rows: [],
                    },
                },
                rules,
                { prosemirrorDocWidth: 800 }
            ).asArray()
        ).toMatchSnapshot();
    });

    it("transforms a Table with rowSpans and colSpans > 1", () =>
        expect(
            fromPandoc(
                {
                    type: "Table",
                    attr: {
                        identifier: "",
                        classes: [],
                        properties: {},
                    },
                    caption: {
                        type: "Caption",
                        content: [
                            {
                                type: "Plain",
                                content: [
                                    {
                                        type: "Str",
                                        content: "Favorite",
                                    },
                                    {
                                        type: "Space",
                                    },
                                    {
                                        type: "Str",
                                        content: "and",
                                    },
                                    {
                                        type: "Space",
                                    },
                                    {
                                        type: "Str",
                                        content: "Least",
                                    },
                                    {
                                        type: "Space",
                                    },
                                    {
                                        type: "Str",
                                        content: "Favorite",
                                    },
                                    {
                                        type: "Space",
                                    },
                                    {
                                        type: "Str",
                                        content: "Things",
                                    },
                                ],
                            },
                        ],
                    },
                    colSpecs: [
                        {
                            type: "ColSpec",
                            alignment: "AlignDefault",
                            defaultWidth: true,
                        },
                        {
                            type: "ColSpec",
                            alignment: "AlignDefault",
                            defaultWidth: true,
                        },
                        {
                            type: "ColSpec",
                            alignment: "AlignDefault",
                            defaultWidth: true,
                        },
                        {
                            type: "ColSpec",
                            alignment: "AlignDefault",
                            defaultWidth: true,
                        },
                    ],
                    head: {
                        type: "TableHead",
                        attr: {
                            identifier: "",
                            classes: [],
                            properties: {},
                        },
                        rows: [
                            {
                                type: "Row",
                                attr: {
                                    identifier: "",
                                    classes: [],
                                    properties: {},
                                },
                                cells: [
                                    {
                                        type: "Cell",
                                        attr: {
                                            identifier: "",
                                            classes: [],
                                            properties: {},
                                        },
                                        alignment: "AlignDefault",
                                        rowSpan: 1,
                                        colSpan: 1,
                                        content: [],
                                    },
                                    {
                                        type: "Cell",
                                        attr: {
                                            identifier: "",
                                            classes: [],
                                            properties: {},
                                        },
                                        alignment: "AlignDefault",
                                        rowSpan: 1,
                                        colSpan: 1,
                                        content: [],
                                    },
                                    {
                                        type: "Cell",
                                        attr: {
                                            identifier: "",
                                            classes: [],
                                            properties: {},
                                        },
                                        alignment: "AlignDefault",
                                        rowSpan: 1,
                                        colSpan: 1,
                                        content: [
                                            {
                                                type: "Plain",
                                                content: [
                                                    {
                                                        type: "Str",
                                                        content: "Bob",
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: "Cell",
                                        attr: {
                                            identifier: "",
                                            classes: [],
                                            properties: {},
                                        },
                                        alignment: "AlignDefault",
                                        rowSpan: 1,
                                        colSpan: 1,
                                        content: [
                                            {
                                                type: "Plain",
                                                content: [
                                                    {
                                                        type: "Str",
                                                        content: "Alice",
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    bodies: [
                        {
                            type: "TableBody",
                            rowHeadColumns: 2,
                            attr: {
                                identifier: "",
                                classes: [],
                                properties: {},
                            },
                            headRows: [],
                            bodyRows: [
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 2,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Favorite",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Color",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Blue",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Purple",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Flavor",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Banana",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content:
                                                                "Chocolate",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 2,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Least",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "Favorite",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Color",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Yellow",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Pink",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Flavor",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Mint",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "Walnut",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "Row",
                                    attr: {
                                        identifier: "",
                                        classes: [],
                                        properties: {},
                                    },
                                    cells: [
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 4,
                                            content: [
                                                {
                                                    type: "Plain",
                                                    content: [
                                                        {
                                                            type: "Str",
                                                            content: "This",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "is",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "just",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "some",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "stuff",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "at",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "the",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "bottom",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "of",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "the",
                                                        },
                                                        {
                                                            type: "Space",
                                                        },
                                                        {
                                                            type: "Str",
                                                            content: "table.",
                                                        },
                                                    ],
                                                },
                                            ],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [],
                                        },
                                        {
                                            type: "Cell",
                                            attr: {
                                                identifier: "",
                                                classes: [],
                                                properties: {},
                                            },
                                            alignment: "AlignDefault",
                                            rowSpan: 1,
                                            colSpan: 1,
                                            content: [],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                    foot: {
                        type: "TableFoot",
                        attr: {
                            identifier: "",
                            classes: [],
                            properties: {},
                        },
                        rows: [],
                    },
                },
                rules
            ).asArray()
        ).toMatchSnapshot());

    it("transforms Math (mathType=InlineMath) into an equation", () => {
        expect(
            fromPandoc(
                {
                    type: "Math",
                    mathType: "InlineMath",
                    content: "e^{i\\pi} = -1",
                },
                rules
            ).asArray()
        ).toMatchSnapshot();
    });

    it("transforms Math (mathType=DisplayMath) into a block_equation", () => {
        expect(
            fromPandoc(
                {
                    type: "Math",
                    mathType: "DisplayMath",
                    content: "e^{i\\pi} = -1",
                },
                rules
            ).asArray()
        ).toMatchSnapshot();
    });

    it("transforms Quoted elements correctly", () => {
        expect(
            fromPandoc(
                {
                    type: "Emph",
                    content: [
                        { type: "Str", content: "Quoted" },
                        { type: "Space" },
                        { type: "Str", content: "nodes" },
                        { type: "Space" },
                        { type: "Str", content: "are" },
                        { type: "Space" },
                        { type: "Str", content: "a" },
                        {
                            type: "Quoted",
                            quoteType: "SingleQuote",
                            content: [
                                { type: "Str", content: "good" },
                                { type: "Space" },
                                { type: "Str", content: "idea" },
                            ],
                        },
                        { type: "Str", content: "!!!" },
                    ],
                },
                rules
            ).asArray()
        ).toMatchSnapshot();
    });

    it("respects the useSmartQuotes config option when transforming Quoted elements", () => {
        expect(
            fromPandoc(
                {
                    type: "Emph",
                    content: [
                        { type: "Str", content: "Quoted" },
                        { type: "Space" },
                        { type: "Str", content: "nodes" },
                        { type: "Space" },
                        { type: "Str", content: "are" },
                        { type: "Space" },
                        { type: "Str", content: "a" },
                        {
                            type: "Quoted",
                            quoteType: "DoubleQuote",
                            content: [
                                { type: "Str", content: "good" },
                                { type: "Space" },
                                { type: "Str", content: "idea" },
                            ],
                        },
                        { type: "Str", content: "!!!" },
                    ],
                },
                rules,
                { useSmartQuotes: true }
            ).asArray()
        ).toMatchSnapshot();
    });
});
