/* global describe, it, expect */
import * as prosemirrorSchema from "../../../example/schema";

import { ProsemirrorSchema } from "../../../types";
import { getNaiveTokenList, healNaiveTokenList, Token, heal } from "../heal";

const toyProsemirrorSchmea: ProsemirrorSchema = {
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
                    children: [
                        {
                            type: "B",
                            children: [
                                { type: "C", children: [{ type: "D" }] },
                            ],
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
                        children: [
                            {
                                type: "B",
                                children: [
                                    { type: "D" },
                                    {
                                        type: "C",
                                        children: [
                                            { type: "D" },
                                            { type: "D" },
                                        ],
                                    },
                                ],
                            },
                        ],
                    }),
                    toyProsemirrorSchmea
                )
            )
        ).toEqual(
            "O(A) O(B) O(D) C(D) O(C) O(D) C(D) O(D) C(D) C(C) C(B) C(A)"
        );
    });

    it("heals an invalid Prosemirror tree", () => {
        const naiveList = getNaiveTokenList({
            type: "A",
            children: [{ type: "B", children: [{ type: "B" }] }],
        });
        expect(
            stringify(healNaiveTokenList(naiveList, toyProsemirrorSchmea))
        ).toEqual("O(A) O*(B) C(B) O(B) C(B) O*(B) C(B) C(A)");
    });

    it("heals a more complicated invalid Prosemirror tree", () => {
        const naiveList = getNaiveTokenList({
            type: "A",
            children: [
                {
                    type: "B",
                    children: [
                        { type: "B" },
                        { type: "D", children: [{ type: "C" }] },
                    ],
                },
            ],
        });
        expect(
            stringify(healNaiveTokenList(naiveList, toyProsemirrorSchmea))
        ).toEqual(
            "O(A) O*(B) C(B) O(B) C(B) O*(B) O*(D) C(D) O(C) C(C) O*(D) C(D) C(B) C(A)"
        );
    });

    it("heals a real-world example of a misplaced image element", () => {
        const naiveList = getNaiveTokenList({
            type: "doc",
            children: [
                {
                    type: "bullet_list",
                    children: [
                        {
                            type: "list_item",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
                                },
                            ],
                        },
                        { type: "list_item", children: [{ type: "image" }] },
                        {
                            type: "list_item",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
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
            children: [
                {
                    type: "bullet_list",
                    children: [
                        {
                            type: "list_item",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
                                },
                                {
                                    type: "paragraph",
                                    children: [
                                        { type: "text" },
                                        { type: "image" },
                                        { type: "text" },
                                    ],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
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
                    children: [
                        {
                            type: "bullet_list",
                            children: [
                                {
                                    type: "list_item",
                                    children: [
                                        {
                                            type: "paragraph",
                                            children: [{ type: "text" }],
                                        },
                                    ],
                                },
                                {
                                    type: "list_item",
                                    children: [{ type: "image" }],
                                },
                                {
                                    type: "list_item",
                                    children: [
                                        {
                                            type: "paragraph",
                                            children: [{ type: "text" }],
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
            children: [
                {
                    type: "bullet_list",
                    children: [
                        {
                            type: "list_item",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
                                },
                            ],
                        },
                    ],
                },
                { type: "image" },
                {
                    type: "bullet_list",
                    children: [
                        {
                            type: "list_item",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
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
                    children: [
                        {
                            type: "bullet_list",
                            children: [
                                {
                                    type: "list_item",
                                    children: [
                                        {
                                            type: "paragraph",
                                            children: [{ type: "text" }],
                                        },
                                        {
                                            type: "paragraph",
                                            children: [
                                                { type: "text" },
                                                { type: "image" },
                                                { type: "text" },
                                            ],
                                        },
                                    ],
                                },
                                {
                                    type: "list_item",
                                    children: [
                                        {
                                            type: "paragraph",
                                            children: [{ type: "text" }],
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
            children: [
                {
                    type: "bullet_list",
                    children: [
                        {
                            type: "list_item",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
                                },
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
                                },
                                { type: "image" },
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
                                },
                            ],
                        },
                        {
                            type: "list_item",
                            children: [
                                {
                                    type: "paragraph",
                                    children: [{ type: "text" }],
                                },
                            ],
                        },
                    ],
                },
            ],
        });
    });
});
