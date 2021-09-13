import { rules } from "example/scratch";
import { createAttr } from "transform/util";

import { fromProsemirror } from "../fromProsemirror";

describe("fromProsemirror", () => {
    it("transforms a doc into a Doc", () => {
        expect(
            fromProsemirror(
                {
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
                                {
                                    type: "text",
                                    text: "Ch-ch-ch-ch-ch-cherry bomb!",
                                },
                            ],
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
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
        });
    });

    it("transforms a simple string", () => {
        expect(
            fromProsemirror(
                { type: "text", text: "Hello world!" },
                rules
            ).asArray()
        ).toEqual([
            { type: "Str", content: "Hello" },
            { type: "Space" },
            { type: "Str", content: "world!" },
        ]);
    });

    it("performs a simple transformation from Prosemirror marks to nodes", () => {
        expect(
            fromProsemirror(
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            marks: [{ type: "strong" }],
                            text: "Hello world!",
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
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
        });
    });

    it("transforms multiple marks into nested Pandoc nodes", () => {
        expect(
            fromProsemirror(
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            marks: [{ type: "strong" }, { type: "em" }],
                            text: "Hello world!",
                        },
                        {
                            type: "text",
                            marks: [{ type: "strong" }, { type: "em" }],
                            text: "Hello again!!",
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
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
                                { type: "Str", content: "Hello" },
                                { type: "Space" },
                                { type: "Str", content: "again!!" },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("transforms a code_block into a CodeBlock", () => {
        expect(
            fromProsemirror(
                {
                    type: "code_block",
                    content: [{ type: "text", text: "hello_world()" }],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "CodeBlock",
            content: "hello_world()",
            attr: createAttr(""),
        });
    });

    it("transforms a blockquote into a BlockQuote", () => {
        expect(
            fromProsemirror(
                {
                    type: "blockquote",
                    content: [
                        {
                            type: "paragraph",
                            content: [{ type: "text", text: "Lorem Ipsum?" }],
                        },
                        {
                            type: "paragraph",
                            content: [
                                {
                                    type: "text",
                                    text: "More like Borem Ipsum!",
                                },
                            ],
                        },
                    ],
                },
                rules
            ).asNode()
        ).toEqual({
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
        });
    });

    it("transforms a heading into a header", () => {
        expect(
            fromProsemirror(
                {
                    type: "heading",
                    attrs: {
                        level: 1,
                        id: "lesson-one",
                    },
                    content: [{ type: "text", text: "Lesson One" }],
                },
                rules
            ).asNode()
        ).toEqual({
            type: "Header",
            attr: createAttr("lesson-one", [], {}),
            level: 1,
            content: [
                { type: "Str", content: "Lesson" },
                { type: "Space" },
                { type: "Str", content: "One" },
            ],
        });
    });

    it("transforms a horizontal_rule into a HorizontalRule", () => {
        expect(
            fromProsemirror(
                {
                    type: "horizontal_rule",
                },
                rules
            ).asNode()
        ).toEqual({ type: "HorizontalRule" });
    });

    it("transforms a bullet_list into a BulletList", () => {
        const input = {
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

        const output = {
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

        expect(fromProsemirror(input, rules).asNode()).toEqual(output);
    });

    it("transforms an ordered_list into an OrderedList", () => {
        const input = {
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

        const output = {
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

        expect(fromProsemirror(input, rules).asNode()).toEqual(output);
    });

    it("transforms links", () => {
        const link = {
            type: "text",
            marks: [
                {
                    type: "link",
                    attrs: { href: "https://example.com", title: "Hi!" },
                },
            ],
            text: "Hey!",
        };
        expect(fromProsemirror(link, rules).asNode()).toEqual({
            type: "Link",
            attr: createAttr(""),
            target: {
                url: "https://example.com",
                title: "Hi!",
            },
            content: [{ type: "Str", content: "Hey!" }],
        });
    });
});
