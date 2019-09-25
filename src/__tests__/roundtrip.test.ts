import { callPandoc } from "../util";
import { parsePandocJson } from "../parse";
import { emitPandocJson } from "../emit";

/* global describe, it, expect */

const testRoundtrip = (str: string, format: string = "markdown") => {
    const json = JSON.parse(callPandoc(str, format, "json"));
    const pandocAst = parsePandocJson(json);
    const emittedJson = emitPandocJson(pandocAst);
    expect(json).toEqual(emittedJson);
};

const simpleTest = `

# Test document

This is my _test document!_ You're gonna love it.

## A section

Here is a section. *This is bold, I think?*
[This is a link](https://pubpub.org) for more information.

## Another section

![Aha, this is an image](https://knowyourapples.com/jazz.jpg)

1. This is a numbered list
2. This is a second entry
    - Oh no
    - We're going deeper
        - And deeper still
    - Please stop
3. Okay, that's better [^1]

> This is a quote from \`someone\` famous

| This is also that? [^2]

\`\`\`
this_is_a_code_block();
\`\`\`

And now, a table of information:

|  Apple        | Rating                          |
|---------------|---------------------------------|
| Red Delicious | Terrible                        |
| Granny Smith  | Bad, except for *pie*!          |
| Jazz          | It's fine                       |
| Macintosh     | Hey, not bad!                   |
| Honeycrisp    | That's the hometown apple, baby |


That is the end of our document.

[^1]: It's actually still not very good.
[^2]: Maybe. Lol.
`;

describe("parse/emit roundtrip", () => {
    it("handles a simple document", () => {
        testRoundtrip(simpleTest);
    });
});
