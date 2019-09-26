import { spawnSync } from "child_process";

import { parsePandocJson } from "./parse";
import { RuleSet } from "./transform/transformer";
import { fromPandoc } from "./transform/fromPandoc/fromPandoc";
import { PandocJson } from "./types";

export const callPandoc = (
    source: string,
    inputFormat: string,
    outputFormat: string = "json",
    extraArgs: string[] = []
) => {
    return spawnSync(
        "pandoc",
        ["-f", inputFormat, "-t", outputFormat, "--quiet", ...extraArgs],
        {
            input: source,
        }
    )
        .output.filter(x => x)
        .map(x => x.toString())
        .join("");
};

export const loadAndTransformFromPandoc = (
    contents: string,
    inputFormat: string,
    rules: RuleSet<any, any>
) => {
    const pandocResult = callPandoc(contents, inputFormat, "json");
    let json: PandocJson;
    try {
        json = JSON.parse(pandocResult);
    } catch (err) {
        console.error(`Couldn't parse Pandoc result: ${pandocResult}`);
    }
    const pandocAst = parsePandocJson(json);
    return fromPandoc(pandocAst, rules).asNode();
};
