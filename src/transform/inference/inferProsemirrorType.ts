import { ProsemirrorMark, ProsemirrorNode, ProsemirrorSchema } from "types";

import { OneOrMore, Trim } from "./shared";

type Resolve<Str, Schema extends ProsemirrorSchema> =
    | ResolveZeroOrMore<Str, Schema>
    | ResolveOneOrMore<Str, Schema>
    | ResolveParens<Str, Schema>
    | ResolveChoice<Str, Schema>
    | ResolveIdentifier<Str, Schema>;

type ResolveZeroOrMore<
    Str,
    Schema extends ProsemirrorSchema
> = Str extends `${infer Some}*`
    ? Resolve<Some, Schema> extends never
        ? never
        : Resolve<Some, Schema>[]
    : never;

type ResolveOneOrMore<
    Str,
    Schema extends ProsemirrorSchema
> = Str extends `${infer Some}+`
    ? Resolve<Some, Schema> extends never
        ? never
        : OneOrMore<Resolve<Some, Schema>>
    : never;

type ResolveParens<
    Str,
    Schema extends ProsemirrorSchema
> = Str extends `(${infer Some})` ? Resolve<Some, Schema> : never;

type ResolveChoice<
    Str,
    Schema extends ProsemirrorSchema
> = Str extends `${infer Some}|${infer Rest}`
    ? Resolve<Trim<Some>, Schema> | Resolve<Trim<Rest>, Schema>
    : never;

// TODO(ian): Maybe add some real inference here if it turns out to be possible
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ResolveIdentifier<
    Str,
    Schema extends ProsemirrorSchema
> = Str extends Nodes<Schema> ? ProsemirrorNode<Str> : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Marks<Str> = Str extends ProsemirrorSchema<infer _, infer FoundMarks>
    ? FoundMarks
    : never;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type Nodes<Str> = Str extends ProsemirrorSchema<infer FoundNodes, infer _>
    ? FoundNodes
    : never;

export type InferProsemirrorNodePattern<
    Str,
    Schema extends ProsemirrorSchema
> = Resolve<Str, Schema>;

export type InferProsemirrorNodeType<
    Str,
    Schema extends ProsemirrorSchema
> = Str extends Nodes<Schema> ? ProsemirrorNode<Str> : never;

export type InferProsemirrorMarkType<
    Str,
    Schema extends ProsemirrorSchema
> = Str extends Marks<Schema> ? ProsemirrorMark<Str> : never;

export type InferProsemirrorElementType<
    Str,
    Schema extends ProsemirrorSchema
> =
    | InferProsemirrorNodeType<Str, Schema>
    | InferProsemirrorMarkType<Str, Schema>;
