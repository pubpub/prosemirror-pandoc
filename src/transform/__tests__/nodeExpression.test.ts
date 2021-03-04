/* global describe, it, expect */
import { acceptItems, parseExpr } from "../nodeExpression";

interface Node {
    type: string;
}

const n = (s: string): Node => ({ type: s });

describe("parseRegexp", () => {
    it("handles a simple identifier", () => {
        expect(parseExpr("Foo")).toEqual({
            type: "identifier",
            identifier: "Foo",
        });
    });

    it("handles a sequence of identifiers", () => {
        expect(parseExpr("Foo Bar Baz")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo",
                },
                {
                    type: "identifier",
                    identifier: "Bar",
                },
                {
                    type: "identifier",
                    identifier: "Baz",
                },
            ],
        });
    });

    it("handles zero-or-more quantifiers (*)", () => {
        expect(parseExpr("Foo*")).toEqual({
            type: "zeroOrMore",
            child: {
                type: "identifier",
                identifier: "Foo",
            },
        });
    });

    it("handles zero-or-more quantifiers (*) in context", () => {
        expect(parseExpr("Foo Bar* Baz")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo",
                },
                {
                    type: "zeroOrMore",
                    child: {
                        type: "identifier",
                        identifier: "Bar",
                    },
                },
                {
                    type: "identifier",
                    identifier: "Baz",
                },
            ],
        });
    });

    it("handles one-or-more quantifiers (+)", () => {
        expect(parseExpr("Foo+")).toEqual({
            type: "oneOrMore",
            child: {
                type: "identifier",
                identifier: "Foo",
            },
        });
    });

    it("handles one-or-more quantifiers (+) in context", () => {
        expect(parseExpr("Foo Bar Baz+")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo",
                },
                {
                    type: "identifier",
                    identifier: "Bar",
                },
                {
                    type: "oneOrMore",
                    child: {
                        type: "identifier",
                        identifier: "Baz",
                    },
                },
            ],
        });
    });

    it("handles a range quantifier with a lower and upper bound", () => {
        expect(parseExpr("(Foo){3, 5}")).toEqual({
            type: "range",
            lowerBound: 3,
            upperBound: 5,
            child: {
                type: "identifier",
                identifier: "Foo",
            },
        });
    });

    it("handles a range quantifier with only a lower bound", () => {
        expect(parseExpr("(Foo){10,}")).toEqual({
            type: "range",
            lowerBound: 10,
            upperBound: null,
            child: {
                type: "identifier",
                identifier: "Foo",
            },
        });
    });

    it("handles an exact range quantifier", () => {
        expect(parseExpr("(Foo){99}")).toEqual({
            type: "range",
            lowerBound: 99,
            upperBound: 99,
            child: {
                type: "identifier",
                identifier: "Foo",
            },
        });
    });

    it("handles a choice of identifiers", () => {
        expect(parseExpr("Foo | Bar | Baz")).toEqual({
            type: "choice",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo",
                },
                {
                    type: "identifier",
                    identifier: "Bar",
                },
                {
                    type: "identifier",
                    identifier: "Baz",
                },
            ],
        });
    });

    it("throws an error when there is an ambiguous mix of sequence and choice markers", () => {
        expect(() => parseExpr("Foo | Bar Baz")).toThrow();
    });

    it("handles grouped choices and sequences", () => {
        expect(parseExpr("Foo (Bar | Baz)")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo",
                },
                {
                    type: "choice",
                    children: [
                        {
                            type: "identifier",
                            identifier: "Bar",
                        },
                        {
                            type: "identifier",
                            identifier: "Baz",
                        },
                    ],
                },
            ],
        });
    });

    it("handles grouped choices and sequences with quantifiers", () => {
        expect(parseExpr("(Foo Bar)+ (Bar | Baz)*")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "oneOrMore",
                    child: {
                        type: "sequence",
                        children: [
                            {
                                type: "identifier",
                                identifier: "Foo",
                            },
                            {
                                type: "identifier",
                                identifier: "Bar",
                            },
                        ],
                    },
                },
                {
                    type: "zeroOrMore",
                    child: {
                        type: "choice",
                        children: [
                            {
                                type: "identifier",
                                identifier: "Bar",
                            },
                            {
                                type: "identifier",
                                identifier: "Baz",
                            },
                        ],
                    },
                },
            ],
        });
    });

    it("handles a very complicated expression", () => {
        expect(
            parseExpr(
                "(Foo Bar+ (Qux* | Baz){10}){3,5} (Bar* | (Baz{6,} Foo))*"
            )
        ).toEqual({
            type: "sequence",
            children: [
                {
                    type: "range",
                    lowerBound: 3,
                    upperBound: 5,
                    child: {
                        type: "sequence",
                        children: [
                            {
                                type: "identifier",
                                identifier: "Foo",
                            },
                            {
                                type: "oneOrMore",
                                child: {
                                    type: "identifier",
                                    identifier: "Bar",
                                },
                            },
                            {
                                type: "range",
                                upperBound: 10,
                                lowerBound: 10,
                                child: {
                                    type: "choice",
                                    children: [
                                        {
                                            type: "zeroOrMore",
                                            child: {
                                                type: "identifier",
                                                identifier: "Qux",
                                            },
                                        },
                                        {
                                            type: "identifier",
                                            identifier: "Baz",
                                        },
                                    ],
                                },
                            },
                        ],
                    },
                },
                {
                    type: "zeroOrMore",
                    child: {
                        type: "choice",
                        children: [
                            {
                                type: "zeroOrMore",
                                child: {
                                    type: "identifier",
                                    identifier: "Bar",
                                },
                            },
                            {
                                type: "sequence",
                                children: [
                                    {
                                        type: "range",
                                        lowerBound: 6,
                                        upperBound: null,
                                        child: {
                                            type: "identifier",
                                            identifier: "Baz",
                                        },
                                    },

                                    {
                                        type: "identifier",
                                        identifier: "Foo",
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        });
    });

    it("normalizes odd spacing and extra parens from an expression", () => {
        expect(
            parseExpr(
                "    ((Foo Bar+ ((Qux* |Baz))   )+ ( (Bar)* |  (Baz Foo))*   ) "
            )
        ).toEqual({
            type: "sequence",
            children: [
                {
                    type: "oneOrMore",
                    child: {
                        type: "sequence",
                        children: [
                            {
                                type: "identifier",
                                identifier: "Foo",
                            },
                            {
                                type: "oneOrMore",
                                child: {
                                    type: "identifier",
                                    identifier: "Bar",
                                },
                            },
                            {
                                type: "choice",
                                children: [
                                    {
                                        type: "zeroOrMore",
                                        child: {
                                            type: "identifier",
                                            identifier: "Qux",
                                        },
                                    },
                                    {
                                        type: "identifier",
                                        identifier: "Baz",
                                    },
                                ],
                            },
                        ],
                    },
                },
                {
                    type: "zeroOrMore",
                    child: {
                        type: "choice",
                        children: [
                            {
                                type: "zeroOrMore",
                                child: {
                                    type: "identifier",
                                    identifier: "Bar",
                                },
                            },
                            {
                                type: "sequence",
                                children: [
                                    {
                                        type: "identifier",
                                        identifier: "Baz",
                                    },

                                    {
                                        type: "identifier",
                                        identifier: "Foo",
                                    },
                                ],
                            },
                        ],
                    },
                },
            ],
        });
    });
});

describe("accepts", () => {
    const acceptExpr = (pattern, nodes) =>
        acceptItems(parseExpr(pattern), nodes, (str: string) => (node: Node) =>
            node.type === str
        );

    it("accepts an empty node array where expected", () => {
        expect(acceptExpr("Foo*", [])).toEqual(0);
    });

    it("handles an array of empty nodes", () => {
        expect(acceptExpr("Foo", [])).toEqual(0);
    });

    it("accepts a simple identifier", () => {
        expect(acceptExpr("Foo", [n("Foo")])).toEqual(1);
    });

    it("rejects a mismatched identifier", () => {
        expect(acceptExpr("Foo", [n("Bar")])).toEqual(0);
    });

    it("accepts a sequence of identifiers", () => {
        expect(acceptExpr("Foo Bar", [n("Foo"), n("Bar")])).toEqual(2);
    });

    it("rejects a sequence of mismatched identifiers", () => {
        expect(acceptExpr("Foo Bar", [n("Foo"), n("Baz")])).toEqual(0);
    });

    it("accepts a choice of identifiers", () => {
        expect(acceptExpr("Foo | Bar", [n("Foo")])).toEqual(1);
        expect(acceptExpr("Foo | Bar", [n("Bar")])).toEqual(1);
    });

    it("rejects a mismatched choice of identifiers", () => {
        expect(acceptExpr("Foo | Bar", [n("Baz")])).toEqual(0);
        expect(acceptExpr("Foo | Bar", [n("Qux")])).toEqual(0);
    });

    it("accepts zero or more identifiers", () => {
        expect(acceptExpr("Foo*", [])).toEqual(0);
        expect(acceptExpr("Foo*", [n("Foo")])).toEqual(1);
        expect(acceptExpr("Foo*", [n("Foo"), n("Foo")])).toEqual(2);
        expect(acceptExpr("Foo*", [n("Foo"), n("Foo"), n("Foo")])).toEqual(3);
    });

    it("accepts one or more identifiers", () => {
        expect(acceptExpr("Foo+", [])).toEqual(0);
        expect(acceptExpr("Foo+", [n("Foo")])).toEqual(1);
        expect(acceptExpr("Foo+", [n("Foo"), n("Foo")])).toEqual(2);
        expect(acceptExpr("Foo+", [n("Foo"), n("Foo"), n("Foo")])).toEqual(3);
    });

    it("accepts the number of nodes specified by a range quantifier", () => {
        expect(acceptExpr("Foo{1,3}", [])).toEqual(0);
        expect(acceptExpr("Foo{1,3}", [n("Foo")])).toEqual(1);
        expect(acceptExpr("Foo{1,3}", [n("Foo"), n("Foo")])).toEqual(2);
        expect(acceptExpr("Foo{1,3}", [n("Foo"), n("Foo"), n("Foo")])).toEqual(
            3
        );
        expect(
            acceptExpr("Foo{1,3}", [n("Foo"), n("Foo"), n("Foo"), n("Foo")])
        ).toEqual(3);
    });

    it("accepts the number of nodes specified by an exact range quantifier", () => {
        expect(acceptExpr("Foo{3}", [])).toEqual(0);
        expect(acceptExpr("Foo{3}", [n("Foo")])).toEqual(0);
        expect(acceptExpr("Foo{3}", [n("Foo"), n("Foo")])).toEqual(0);
        expect(acceptExpr("Foo{3}", [n("Foo"), n("Foo"), n("Foo")])).toEqual(3);
        expect(
            acceptExpr("Foo{3}", [n("Foo"), n("Foo"), n("Foo"), n("Foo")])
        ).toEqual(3);
    });

    it("accepts the number of nodes specified by an unbounded range quantifier", () => {
        expect(acceptExpr("Foo{2,}", [])).toEqual(0);
        expect(acceptExpr("Foo{2,}", [n("Foo")])).toEqual(0);
        expect(acceptExpr("Foo{2,}", [n("Foo"), n("Foo")])).toEqual(2);
        expect(acceptExpr("Foo{2,}", [n("Foo"), n("Foo"), n("Foo")])).toEqual(
            3
        );
        expect(
            acceptExpr("Foo{2,}", [n("Foo"), n("Foo"), n("Foo"), n("Foo")])
        ).toEqual(4);
    });

    it("composes quantifiers", () => {
        expect(acceptExpr("(Foo{2})+", [])).toEqual(0);
        expect(acceptExpr("(Foo{2})+", [n("Foo")])).toEqual(0);
        expect(acceptExpr("(Foo{2})+", [n("Foo"), n("Foo")])).toEqual(2);
        expect(acceptExpr("(Foo{2})+", [n("Foo"), n("Foo"), n("Foo")])).toEqual(
            2
        );
        expect(
            acceptExpr("(Foo{2})+", [n("Foo"), n("Foo"), n("Foo"), n("Foo")])
        ).toEqual(4);
    });

    it("handles range quantifiers in a sequence", () => {
        expect(acceptExpr("Foo Bar{1,2} Baz", [n("Foo"), n("Baz")])).toEqual(0);
        expect(
            acceptExpr("Foo Bar{1,2} Baz", [n("Foo"), n("Bar"), n("Baz")])
        ).toEqual(3);
        expect(
            acceptExpr("Foo Bar{1,2} Baz", [
                n("Foo"),
                n("Bar"),
                n("Bar"),
                n("Baz"),
            ])
        ).toEqual(4);
        expect(
            acceptExpr("Foo Bar{1,2} Baz", [
                n("Foo"),
                n("Bar"),
                n("Bar"),
                n("Bar"),
                n("Baz"),
            ])
        ).toEqual(0);
    });

    it("can use an unbounded range quantifier like a zeroOrMore", () => {
        expect(acceptExpr("Foo{0,}", [])).toEqual(0);
        expect(acceptExpr("Foo{0,}", [n("Foo")])).toEqual(1);
        expect(acceptExpr("Foo{0,}", [n("Foo"), n("Foo")])).toEqual(2);
        expect(acceptExpr("Foo{0,}", [n("Foo"), n("Foo"), n("Foo")])).toEqual(
            3
        );
        expect(
            acceptExpr("Foo{0,}", [n("Foo"), n("Foo"), n("Foo"), n("Foo")])
        ).toEqual(4);
    });

    it("returns a correct value when there are leftover nodes", () => {
        expect(acceptExpr("Foo+", [n("Bar")])).toEqual(0);
        expect(acceptExpr("Foo Foo", [n("Foo"), n("Foo"), n("Foo")])).toEqual(
            2
        );
    });

    it("accepts a sequence of multiple identifiers", () => {
        expect(acceptExpr("Foo+ Bar*", [n("Foo"), n("Foo")])).toEqual(2);
        expect(acceptExpr("Foo+ Bar*", [n("Foo"), n("Foo"), n("Bar")])).toEqual(
            3
        );
        expect(acceptExpr("Foo+ Bar*", [n("Foo"), n("Bar")])).toEqual(2);
    });

    it("handles a sequence of multiple identifiers with quantifiers", () => {
        expect(acceptExpr("Foo+ Bar*", [n("Foo"), n("Foo"), n("Baz")])).toEqual(
            2
        );
        expect(acceptExpr("Foo+ Bar*", [n("Bar")])).toEqual(0);
    });

    it("accepts a combination of choices and sequences", () => {
        expect(
            acceptExpr("(Foo | Bar) (Bar Baz)+", [n("Foo"), n("Bar"), n("Baz")])
        ).toEqual(3);
        expect(
            acceptExpr("(Foo | Bar) (Bar Baz)+", [
                n("Foo"),
                n("Bar"),
                n("Baz"),
                n("Bar"),
                n("Baz"),
            ])
        ).toEqual(5);
    });

    it("handles a combination of choices and sequences that matches some nodes", () => {
        expect(
            acceptExpr("(Foo | Bar) (Bar Baz)+", [n("Qux"), n("Bar"), n("Baz")])
        ).toEqual(0);
        expect(
            acceptExpr("(Foo | Bar) (Bar Baz)+", [
                n("Foo"),
                n("Bar"),
                n("Baz"),
                n("Bar"),
            ])
        ).toEqual(3);
    });

    it("handles a combination of quantifiers", () => {
        expect(
            acceptExpr("(Foo | Bar)* (Bar Baz)+ Qux", [
                n("Foo"),
                n("Bar"),
                n("Bar"),
                n("Bar"),
                n("Bar"),
                n("Baz"),
                n("Bar"),
                n("Baz"),
                n("Qux"),
            ])
        ).toEqual(9);
    });

    it("handles nodes that might be swallowed by a greedy quantifier", () => {
        expect(
            acceptExpr("(Foo | Bar)* Bar", [
                n("Foo"),
                n("Bar"),
                n("Bar"),
                n("Bar"),
                n("Bar"),
            ])
        ).toEqual(5);
    });

    it("handles an unnecessarily complicated expression", () => {
        expect(
            acceptExpr("(Foo | Bar)* Baz (Bar | Qux{2,5} | Baz)+ Qux", [
                n("Foo"),
                n("Bar"),
                n("Baz"),
                n("Qux"),
                n("Qux"),
                n("Baz"),
                n("Qux"),
                n("Qux"),
                n("Qux"),
                n("Bar"),
                n("Qux"),
                n("Foo"),
                n("Bar"),
            ])
        ).toEqual(11);
    });
});
