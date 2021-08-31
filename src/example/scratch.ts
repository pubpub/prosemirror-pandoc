import { createAttr, flatten, intersperse } from "transform/util";
import { RuleSet } from "../transform/ruleset";

import { prosemirrorSchema } from "./schema";

const rules = new RuleSet(prosemirrorSchema);

// Nodes!

rules.toProsemirrorNode("LineBlock", (node, { transform }) => {
    const lines = node.content.map((line) => transform(line).asArray());
    return {
        type: "paragraph",
        content: flatten(
            intersperse(lines, () => ({
                type: "hard_break",
            }))
        ),
    };
});

// Marks!

const bareMarkTransformPairs = [
    ["Strong", "strong"],
    ["Emph", "em"],
    ["Strikeout", "strike"],
    ["Superscript", "sup"],
    ["Subscript", "sub"],
] as const;

bareMarkTransformPairs.forEach(([from, to]) =>
    rules.transform(from, to, (pandocType, prosemirrorType) => {
        return {
            toProsemirrorMark: () => {
                return {
                    type: prosemirrorType,
                };
            },
            fromProsemirrorMark: (_, content) => {
                return {
                    type: pandocType,
                    content,
                };
            },
        };
    })
);

rules.transform("Link", "link", {
    toProsemirrorMark: (link) => {
        return {
            type: "link",
            attrs: {
                href: link.target.url,
                title: link.target.title,
            },
        };
    },
    fromProsemirrorMark: (link, content) => {
        return {
            type: "Link",
            attr: createAttr(),
            content,
            target: {
                url: link.attrs.href.toString(),
                title: link.attrs.title.toString(),
            },
        };
    },
});
