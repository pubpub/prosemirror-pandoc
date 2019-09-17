/* global describe, it, expect */
import rules from "../../example/rules";

import { fromPandoc } from "../transformer";
import { createAttr } from "../util";
import { Header } from "../../types";

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
            )
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
            )
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
            )
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
        expect(fromPandoc(header, rules)).toEqual({
            type: "heading",
            attrs: {
                level: 1,
                id: "lesson-one",
            },
            children: [{ type: "text", text: "Lesson One" }],
        });
    });

    it("transforms a HorizontalRule into a horizontal_rule", () => {
        expect(fromPandoc({ type: "HorizontalRule" }, rules)).toEqual({
            type: "horizontal_rule",
        });
    });
});
