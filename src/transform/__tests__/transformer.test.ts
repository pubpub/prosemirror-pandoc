/* global describe, it, expect */
import rules from "../../example/rules";

import { fromPandoc } from "../transformer";

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
});
