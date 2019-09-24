/* global describe, it, expect */
import { parseInline, parseBlock } from "../parse";

describe("parseInline", () => {
    it("parses a Str", () => {
        expect(parseInline({ t: "Str", c: "Hello!" })).toEqual({
            type: "Str",
            content: "Hello!",
        });
    });

    it("parses a simple inline elements", () => {
        [
            "Emph",
            "Strong",
            "Strikeout",
            "Superscript",
            "Subscript",
            "SmallCaps",
        ].forEach(type => {
            expect(
                // @ts-ignore
                parseInline({ t: type, c: [{ t: "Str", c: "Testing!" }] })
            ).toEqual({
                type,
                content: [{ type: "Str", content: "Testing!" }],
            });
        });
    });

    it("parses an atom element", () => {
        // @ts-ignore
        expect(parseInline({ t: "LineBreak" })).toEqual({ type: "LineBreak" });
    });

    it("parses a Link", () => {
        expect(
            parseInline({
                t: "Link",
                c: [
                    [
                        "this-is-an-identifier",
                        ["these", "are", "classes"],
                        [["key1", "val1"], ["key2", "val2"]],
                    ],
                    [
                        {
                            t: "Strong",
                            c: [
                                { t: "Str", c: "It's" },
                                { t: "Space" },
                                { t: "Str", c: "a" },
                                { t: "Space" },
                                { t: "Str", c: "link!" },
                            ],
                        },
                    ],
                    ["https://url.com", "This is a title??"],
                ],
            })
        ).toMatchSnapshot();
    });
});

describe("parseBlock", () => {
    it("parses a Para with some stuff in it", () => {
        expect(
            parseBlock({
                t: "Para",
                c: [
                    { t: "Strong", c: [{ t: "Str", c: "Hello," }] },
                    { t: "Space" },
                    { t: "Str", c: "world!" },
                ],
            })
        ).toEqual({
            type: "Para",
            content: [
                {
                    type: "Strong",
                    content: [{ type: "Str", content: "Hello," }],
                },
                { type: "Space" },
                { type: "Str", content: "world!" },
            ],
        });
    });

    it("parses an OrderedList", () => {
        expect(
            parseBlock({
                t: "OrderedList",
                c: [
                    [3, { t: "Decimal" }, { t: "Period" }],
                    [
                        [
                            {
                                t: "Para",
                                c: [{ t: "Str", c: "One!" }],
                            },
                        ],
                        [
                            {
                                t: "Para",
                                c: [{ t: "Str", c: "Two!" }],
                            },
                        ],
                        [
                            {
                                t: "Para",
                                c: [{ t: "Str", c: "Three!" }],
                            },
                        ],
                    ],
                ],
            })
        ).toMatchSnapshot();
    });
});
