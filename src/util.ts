import { execSync, spawnSync } from "child_process";

import { parsePandocJson } from "./parse";
import { RuleSet } from "./transform/ruleset";
import { fromPandoc } from "./transform/fromPandoc/fromPandoc";
import { PandocJson } from "./types";

const MAX_BUFFER = 0 * 1024 * 1024;

export const callPandoc = (
    source: string,
    inputFormat: string,
    outputFormat: string = "json",
    extraArgs: string[] = []
) => {
    return spawnSync(
        "pandoc",
        ["-f", inputFormat, "-t", outputFormat, "--quiet", ...extraArgs],
        { input: source, maxBuffer: MAX_BUFFER }
    ).stdout.toString();
};

export const callPandocWithFile = (
    sourcePath: string,
    outputFormat: string = "json",
    inputFormat: string = null,
    extraArgs: string[] = []
) => {
    const extraArgsString = extraArgs.join(" ");
    const inputFormatString = inputFormat ? `-f ${inputFormat}` : "";
    return execSync(
        `pandoc ${sourcePath} ${inputFormatString} -t ${outputFormat} ${extraArgsString}`,
        { maxBuffer: MAX_BUFFER }
    ).toString();
};

export const loadAndTransformFromPandoc = (
    sourcePath: string,
    rules: RuleSet<any>
) => {
    const pandocResult = callPandocWithFile(sourcePath);
    let json: PandocJson;
    try {
        json = JSON.parse(pandocResult);
    } catch (err) {
        if (pandocResult) {
            console.error(`Couldn't parse Pandoc result: ${pandocResult}`);
        } else {
            console.error(err);
        }
    }
    const pandocAst = parsePandocJson(json);
    return fromPandoc(pandocAst, rules).asNode();
};
