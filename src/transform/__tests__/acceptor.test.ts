/* global describe, it, expect */
import { accepts, parseRegexp } from "../acceptor";

// Utility node creator
const n = (s: string) => ({ type: s });

describe("parseRegexp", () => {
    it("handles a simple identifier", () => {
        expect(parseRegexp("Foo")).toEqual({
            type: "identifier",
            identifier: "Foo",
        });
    });

    it("handles a sequence of identifiers", () => {
        expect(parseRegexp("Foo Bar Baz")).toEqual({
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
        expect(parseRegexp("Foo*")).toEqual({
            type: "zeroOrMore",
            child: {
                type: "identifier",
                identifier: "Foo",
            },
        });
    });

    it("handles zero-or-more quantifiers (*) in context", () => {
        expect(parseRegexp("Foo Bar* Baz")).toEqual({
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
        expect(parseRegexp("Foo+")).toEqual({
            type: "oneOrMore",
            child: {
                type: "identifier",
                identifier: "Foo",
            },
        });
    });

    it("handles one-or-more quantifiers (+) in context", () => {
        expect(parseRegexp("Foo Bar Baz+")).toEqual({
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

    it("handles a choice of identifiers", () => {
        expect(parseRegexp("Foo | Bar | Baz")).toEqual({
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
        expect(() => parseRegexp("Foo | Bar Baz")).toThrow();
    });

    it("handles grouped choices and sequences", () => {
        expect(parseRegexp("Foo (Bar | Baz)")).toEqual({
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
        expect(parseRegexp("(Foo Bar)+ (Bar | Baz)*")).toEqual({
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
            parseRegexp("(Foo Bar+ (Qux* | Baz))+ (Bar* | (Baz Foo))*")
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

    it("normalizes odd spacing and extra parens from an expression", () => {
        expect(
            parseRegexp(
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
    it("accepts an empty node array where expected", () => {
        expect(accepts("Foo*", [])).toEqual(true);
    });

    it("does not accept an empty node array where a node is required", () => {
        expect(accepts("Foo", [])).toEqual(false);
    });

    it("accepts a simple identifier", () => {
        expect(accepts("Foo", [n("Foo")])).toEqual(true);
    });

    it("rejects a mismatched identifier", () => {
        expect(accepts("Foo", [n("Bar")])).toEqual(false);
    });

    it("accepts a sequence of identifiers", () => {
        expect(accepts("Foo Bar", [n("Foo"), n("Bar")])).toEqual(true);
    });

    it("rejects a sequence of mismatched identifiers", () => {
        expect(accepts("Foo Bar", [n("Foo"), n("Baz")])).toEqual(false);
    });

    it("accepts a choice of identifiers", () => {
        expect(accepts("Foo | Bar", [n("Foo")])).toEqual(true);
        expect(accepts("Foo | Bar", [n("Bar")])).toEqual(true);
    });

    it("rejects a mismatched choice of identifiers", () => {
        expect(accepts("Foo | Bar", [n("Baz")])).toEqual(false);
        expect(accepts("Foo | Bar", [n("Qux")])).toEqual(false);
    });

    it("accepts zero or more identifiers", () => {
        expect(accepts("Foo*", [])).toEqual(true);
        expect(accepts("Foo*", [n("Foo")])).toEqual(true);
        expect(accepts("Foo*", [n("Foo"), n("Foo")])).toEqual(true);
        expect(accepts("Foo*", [n("Foo"), n("Foo"), n("Foo")])).toEqual(true);
    });

    it("accepts one or more identifiers", () => {
        expect(accepts("Foo+", [])).toEqual(false);
        expect(accepts("Foo+", [n("Foo")])).toEqual(true);
        expect(accepts("Foo+", [n("Foo"), n("Foo")])).toEqual(true);
        expect(accepts("Foo+", [n("Foo"), n("Foo"), n("Foo")])).toEqual(true);
    });

    it("rejects when there are leftover nodes", () => {
        expect(accepts("Foo+", [n("Bar")])).toEqual(false);
        expect(accepts("Foo Foo", [n("Foo"), n("Foo"), n("Foo")])).toEqual(
            false
        );
    });

    it("accepts a sequence of multiple identifiers", () => {
        expect(accepts("Foo+ Bar*", [n("Foo"), n("Foo")])).toEqual(true);
        expect(accepts("Foo+ Bar*", [n("Foo"), n("Foo"), n("Bar")])).toEqual(
            true
        );
        expect(accepts("Foo+ Bar*", [n("Foo"), n("Bar")])).toEqual(true);
    });

    it("rejects a mismatched sequence of multiple identifiers", () => {
        expect(accepts("Foo+ Bar*", [n("Foo"), n("Foo"), n("Baz")])).toEqual(
            false
        );
        expect(accepts("Foo+ Bar*", [n("Bar")])).toEqual(false);
    });

    it("accepts a combination of choices and sequences", () => {
        expect(
            accepts("(Foo | Bar) (Bar Baz)+", [n("Foo"), n("Bar"), n("Baz")])
        ).toEqual(true);
        expect(
            accepts("(Foo | Bar) (Bar Baz)+", [
                n("Foo"),
                n("Bar"),
                n("Baz"),
                n("Bar"),
                n("Baz"),
            ])
        ).toEqual(true);
    });

    it("rejects a mismatched combination of choices and sequences", () => {
        expect(
            accepts("(Foo | Bar) (Bar Baz)+", [n("Qux"), n("Bar"), n("Baz")])
        ).toEqual(false);
        expect(
            accepts("(Foo | Bar) (Bar Baz)+", [
                n("Foo"),
                n("Bar"),
                n("Baz"),
                n("Bar"),
            ])
        ).toEqual(false);
    });

    it("handles a combination of quantifiers", () => {
        expect(
            accepts("(Foo | Bar)* (Bar Baz)+ Qux", [
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
        ).toEqual(true);
    });

    it("handles nodes that might be swallowed by a greedy quantifier", () => {
        expect(
            accepts("(Foo | Bar)* Bar", [
                n("Foo"),
                n("Bar"),
                n("Bar"),
                n("Bar"),
                n("Bar"),
            ])
        ).toEqual(true);
    });
});
