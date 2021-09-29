export type Identifier = {
    type: "identifier";
    identifier: string;
};

export type OneOrMore = {
    type: "oneOrMore";
    child: Expr;
};

export type ZeroOrMore = {
    type: "zeroOrMore";
    child: Expr;
};

export type Range = {
    type: "range";
    lowerBound: number;
    upperBound: number | null;
    child: Expr;
};

export type Sequence = {
    type: "sequence";
    children: Expr[];
};
export type Choice = {
    type: "choice";
    children: Expr[];
};

export type IdentifierMatch<Item> = (id: string) => (item: Item) => boolean;

export type Expr =
    | Identifier
    | OneOrMore
    | ZeroOrMore
    | Sequence
    | Choice
    | Range;
