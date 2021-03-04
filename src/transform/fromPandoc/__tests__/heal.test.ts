/* global describe, it, expect */
import * as prosemirrorSchema from "../../../example/schema";

import { ProsemirrorSchema } from "../../../types";
import { getNaiveTokenList, healNaiveTokenList, Token, heal } from "../heal";

const toyProsemirrorSchema: ProsemirrorSchema = {
    nodes: {
        A: {
            defining: true,
            content: "B*",
        },
        B: {
            defining: true,
            content: "(C|D)*",
        },
        C: {
            defining: true,
            content: "D*",
        },
        D: {
            defining: true,
            content: "text*",
        },
    },
    marks: {},
};

const stringify = (tokens: Token[]) =>
    tokens
        .map((t: Token) => {
            const prefix = t.type === "open" ? "O" : "C";
            const maybeAsterisk =
                t.type === "open" && t.createdFromSplit ? "*" : "";
            return `${prefix}${maybeAsterisk}(${t.node.type})`;
        })
        .join(" ");

describe("getNaiveTokenList", () => {
    it("tokenizes a Prosemirror tree", () => {
        expect(
            stringify(
                getNaiveTokenList({
                    type: "A",
                    content: [
                        {
                            type: "B",
                            content: [{ type: "C", content: [{ type: "D" }] }],
                        },
                    ],
                })
            )
        ).toEqual("O(A) O(B) O(C) O(D) C(D) C(C) C(B) C(A)");
    });
});

describe("healNaiveTokenList", () => {
    it("passes through a valid tree", () => {
        expect(
            stringify(
                healNaiveTokenList(
                    getNaiveTokenList({
                        type: "A",
                        content: [
                            {
                                type: "B",
                                content: [
                                    { type: "D" },
                                    {
                                        type: "C",
                                        content: [{ type: "D" }, { type: "D" }],
                                    },
                                ],
                            },
                        ],
                    }),
                    toyProsemirrorSchema
                )
            )
        ).toEqual(
            "O(A) O(B) O(D) C(D) O(C) O(D) C(D) O(D) C(D) C(C) C(B) C(A)"
        );
    });

    it("heals an invalid Prosemirror tree", () => {
        const naiveList = getNaiveTokenList({
            type: "A",
            content: [{ type: "B", content: [{ type: "B" }] }],
        });
        expect(
            stringify(healNaiveTokenList(naiveList, toyProsemirrorSchema))
        ).toEqual("O(A) O*(B) C(B) O(B) C(B) O*(B) C(B) C(A)");
    });

    it("heals a more complicated invalid Prosemirror tree", () => {
        const naiveList = getNaiveTokenList({
            type: "A",
            content: [
                {
                    type: "B",
                    content: [
                        { type: "B" },
                        { type: "D", content: [{ type: "C" }] },
                    ],
                },
            ],
        });
        expect(
            stringify(healNaiveTokenList(naiveList, toyProsemirrorSchema))
        ).toEqual(
            "O(A) O*(B) C(B) O(B) C(B) O*(B) O*(D) C(D) O(C) C(C) O*(D) C(D) C(B) C(A)"
        );
    });

    it("heals a real-world example of a misplaced image element", () => {
        const naiveList = getNaiveTokenList({
            type: "doc",
            content: [
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                            ],
                        },
                        { type: "list_item", content: [{ type: "image" }] },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        expect(
            stringify(healNaiveTokenList(naiveList, prosemirrorSchema))
        ).toMatchSnapshot();
    });

    it("heals a real-world example of a misplaced image element that is less dire", () => {
        const naiveList = getNaiveTokenList({
            type: "doc",
            content: [
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                                {
                                    type: "paragraph",
                                    content: [
                                        { type: "text" },
                                        { type: "image" },
                                        { type: "text" },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
        expect(
            stringify(healNaiveTokenList(naiveList, prosemirrorSchema))
        ).toMatchSnapshot();
    });
});

describe("heal", () => {
    it("heals an improper Prosemirror document", () => {
        expect(
            heal(
                {
                    type: "doc",
                    content: [
                        {
                            type: "bullet_list",
                            content: [
                                {
                                    type: "list_item",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text" }],
                                        },
                                    ],
                                },
                                {
                                    type: "list_item",
                                    content: [{ type: "image" }],
                                },
                                {
                                    type: "list_item",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text" }],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                prosemirrorSchema
            )
        ).toEqual({
            type: "doc",
            content: [
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                            ],
                        },
                    ],
                },
                { type: "image" },
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });

    it("heals a broken Prosemirror document that requires less intervention", () => {
        expect(
            heal(
                {
                    type: "doc",
                    content: [
                        {
                            type: "bullet_list",
                            content: [
                                {
                                    type: "list_item",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text" }],
                                        },
                                        {
                                            type: "paragraph",
                                            content: [
                                                { type: "text" },
                                                { type: "image" },
                                                { type: "text" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "list_item",
                                    content: [
                                        {
                                            type: "paragraph",
                                            content: [{ type: "text" }],
                                        },
                                    ],
                                },
                            ],
                        },
                    ],
                },
                prosemirrorSchema
            )
        ).toEqual({
            type: "doc",
            content: [
                {
                    type: "bullet_list",
                    content: [
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                                { type: "image" },
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            content: [
                                {
                                    type: "paragraph",
                                    content: [{ type: "text" }],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
