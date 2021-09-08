import { rules } from "example/scratch";

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

    it("transforms nested inline nodes into multiple Prosemirror marks", () => {
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
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
