/* global describe, it, expect */
import rules from "../../example/rules";

import { fromPandoc } from "../fromPandoc";
import { createAttr } from "../util";
import { Header, OrderedList, BulletList } from "../../types";

describe("fromPandoc", () => {
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
            )
        ).toEqual([
            {
                type: "paragraph",
                children: [{ type: "text", text: "Hello dad!" }],
            },
            {
                type: "paragraph",
                children: [{ type: "text", text: "Hello mom!" }],
            },
            {
                type: "paragraph",
                children: [
                    { type: "text", text: "Ch-ch-ch-ch-ch-cherry bomb!" },
                ],
            },
        ]);
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
            children: [
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
                },
                rules
            ).asNode()
        ).toEqual({ type: "code_block", text: "hello_world()" });
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
            children: [
                {
                    type: "paragraph",
                    children: [{ type: "text", text: "Lorem Ipsum?" }],
                },
                {
                    type: "paragraph",
                    children: [
                        { type: "text", text: "More like Borem Ipsum!" },
                    ],
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
            children: [{ type: "text", text: "Lesson One" }],
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
            children: [
                {
                    type: "list_item",
                    children: [
                        {
                            type: "paragraph",
                            children: [{ type: "text", text: "Item One" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    children: [
                        {
                            type: "paragraph",
                            children: [{ type: "text", text: "Item Two" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    children: [
                        {
                            type: "paragraph",
                            children: [{ type: "text", text: "Item Three" }],
                        },
                    ],
                },
            ],
        };
        expect(fromPandoc(input, rules).asNode()).toEqual(expectedOutput);
    });

    it("transforms an BulletList into an bullet_list", () => {
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
            children: [
                {
                    type: "list_item",
                    children: [
                        {
                            type: "paragraph",
                            children: [{ type: "text", text: "Item One" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    children: [
                        {
                            type: "paragraph",
                            children: [{ type: "text", text: "Item Two" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    children: [
                        {
                            type: "paragraph",
                            children: [{ type: "text", text: "Item Three" }],
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
            children: [
                {
                    type: "list_item",
                    children: [
                        {
                            type: "paragraph",
                            children: [{ type: "text", text: "Item One" }],
                        },
                    ],
                },
                {
                    type: "list_item",
                    children: [
                        // This is the added paragraph we expect to see.
                        { type: "paragraph", children: [] },
                        {
                            type: "blockquote",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [
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
            children: [
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
            children: [
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
            children: [
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
            children: [
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
                children: [
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
                children: [
                    {
                        type: "paragraph",
                        children: [
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
                {
                    type: "Strong",
                    content: [{ type: "HorizontalRule" }],
                },
                rules
            ).asNode()
        ).toEqual({ type: "horizontal_rule" });
    });
});
