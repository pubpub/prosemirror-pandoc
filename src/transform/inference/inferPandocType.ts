import { PandocNode } from "../../types";

import { OneOrMore, Trim } from "./shared";

type Resolve<Str> =
    | ResolveZeroOrMore<Str>
    | ResolveOneOrMore<Str>
    | ResolveParens<Str>
    | ResolveChoice<Str>
    | ResolveIdentifier<Str>;

type ResolveZeroOrMore<Str> = Str extends `${infer Some}*`
    ? Resolve<Some> extends never
        ? never
        : Resolve<Some>[]
    : never;

type ResolveOneOrMore<Str> = Str extends `${infer Some}+`
    ? Resolve<Some> extends never
        ? never
        : OneOrMore<Resolve<Some>>
    : never;

type ResolveParens<Str> = Str extends `(${infer Some})` ? Resolve<Some> : never;

type ResolveChoice<Str> = Str extends `${infer Some}|${infer Rest}`
    ? Resolve<Trim<Some>> | Resolve<Trim<Rest>>
    : never;

type ResolveIdentifier<Str> = Str extends PandocNode["type"]
    ? Readonly<PandocNode & { type: Str }>
    : never;

export type InferPandocPattern<Str extends string> = Resolve<Str>;
export type InferPandocNodeType<S> = ResolveIdentifier<S>;
