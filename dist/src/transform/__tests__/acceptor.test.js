"use strict";
exports.__esModule = true;
/* global describe, it, expect */
var acceptor_1 = require("../acceptor");
describe("parseRegexp", function () {
    it("handles a simple identifier", function () {
        expect(acceptor_1.parseRegexp("Foo")).toEqual({
            type: "identifier",
            identifier: "Foo"
        });
    });
    it("handles a sequence of identifiers", function () {
        expect(acceptor_1.parseRegexp("Foo Bar Baz")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo"
                },
                {
                    type: "identifier",
                    identifier: "Bar"
                },
                {
                    type: "identifier",
                    identifier: "Baz"
                },
            ]
        });
    });
    it("handles zero-or-more quantifiers (*)", function () {
        expect(acceptor_1.parseRegexp("Foo*")).toEqual({
            type: "zeroOrMore",
            child: {
                type: "identifier",
                identifier: "Foo"
            }
        });
    });
    it("handles zero-or-more quantifiers (*) in context", function () {
        expect(acceptor_1.parseRegexp("Foo Bar* Baz")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo"
                },
                {
                    type: "zeroOrMore",
                    child: {
                        type: "identifier",
                        identifier: "Bar"
                    }
                },
                {
                    type: "identifier",
                    identifier: "Baz"
                },
            ]
        });
    });
    it("handles one-or-more quantifiers (+)", function () {
        expect(acceptor_1.parseRegexp("Foo+")).toEqual({
            type: "oneOrMore",
            child: {
                type: "identifier",
                identifier: "Foo"
            }
        });
    });
    it("handles one-or-more quantifiers (+) in context", function () {
        expect(acceptor_1.parseRegexp("Foo Bar Baz+")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo"
                },
                {
                    type: "identifier",
                    identifier: "Bar"
                },
                {
                    type: "oneOrMore",
                    child: {
                        type: "identifier",
                        identifier: "Baz"
                    }
                },
            ]
        });
    });
    it("handles a choice of identifiers", function () {
        expect(acceptor_1.parseRegexp("Foo | Bar | Baz")).toEqual({
            type: "choice",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo"
                },
                {
                    type: "identifier",
                    identifier: "Bar"
                },
                {
                    type: "identifier",
                    identifier: "Baz"
                },
            ]
        });
    });
    it("throws an error when there is an ambiguous mix of sequence and choice markers", function () {
        expect(function () { return acceptor_1.parseRegexp("Foo | Bar Baz"); }).toThrow();
    });
    it("handles grouped choices and sequences", function () {
        expect(acceptor_1.parseRegexp("Foo (Bar | Baz)")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "identifier",
                    identifier: "Foo"
                },
                {
                    type: "choice",
                    children: [
                        {
                            type: "identifier",
                            identifier: "Bar"
                        },
                        {
                            type: "identifier",
                            identifier: "Baz"
                        },
                    ]
                },
            ]
        });
    });
    it("handles grouped choices and sequences with quantifiers", function () {
        expect(acceptor_1.parseRegexp("(Foo Bar)+ (Bar | Baz)*")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "oneOrMore",
                    child: {
                        type: "sequence",
                        children: [
                            {
                                type: "identifier",
                                identifier: "Foo"
                            },
                            {
                                type: "identifier",
                                identifier: "Bar"
                            },
                        ]
                    }
                },
                {
                    type: "zeroOrMore",
                    child: {
                        type: "choice",
                        children: [
                            {
                                type: "identifier",
                                identifier: "Bar"
                            },
                            {
                                type: "identifier",
                                identifier: "Baz"
                            },
                        ]
                    }
                },
            ]
        });
    });
    it("handles a very complicated expression", function () {
        expect(acceptor_1.parseRegexp("(Foo Bar+ (Qux* | Baz))+ (Bar* | (Baz Foo))*")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "oneOrMore",
                    child: {
                        type: "sequence",
                        children: [
                            {
                                type: "identifier",
                                identifier: "Foo"
                            },
                            {
                                type: "oneOrMore",
                                child: {
                                    type: "identifier",
                                    identifier: "Bar"
                                }
                            },
                            {
                                type: "choice",
                                children: [
                                    {
                                        type: "zeroOrMore",
                                        child: {
                                            type: "identifier",
                                            identifier: "Qux"
                                        }
                                    },
                                    {
                                        type: "identifier",
                                        identifier: "Baz"
                                    },
                                ]
                            },
                        ]
                    }
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
                                    identifier: "Bar"
                                }
                            },
                            {
                                type: "sequence",
                                children: [
                                    {
                                        type: "identifier",
                                        identifier: "Baz"
                                    },
                                    {
                                        type: "identifier",
                                        identifier: "Foo"
                                    },
                                ]
                            },
                        ]
                    }
                },
            ]
        });
    });
    it("normalizes spacing and extra parens from an expression", function () {
        expect(acceptor_1.parseRegexp("(Foo Bar+ (Qux* |Baz))+ ( (Bar)*   | (Baz Foo))*    )")).toEqual({
            type: "sequence",
            children: [
                {
                    type: "oneOrMore",
                    child: {
                        type: "sequence",
                        children: [
                            {
                                type: "identifier",
                                identifier: "Foo"
                            },
                            {
                                type: "oneOrMore",
                                child: {
                                    type: "identifier",
                                    identifier: "Bar"
                                }
                            },
                            {
                                type: "choice",
                                children: [
                                    {
                                        type: "zeroOrMore",
                                        child: {
                                            type: "identifier",
                                            identifier: "Qux"
                                        }
                                    },
                                    {
                                        type: "identifier",
                                        identifier: "Baz"
                                    },
                                ]
                            },
                        ]
                    }
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
                                    identifier: "Bar"
                                }
                            },
                            {
                                type: "sequence",
                                children: [
                                    {
                                        type: "identifier",
                                        identifier: "Baz"
                                    },
                                    {
                                        type: "identifier",
                                        identifier: "Foo"
                                    },
                                ]
                            },
                        ]
                    }
                },
            ]
        });
    });
});
