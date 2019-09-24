import { spawnSync } from "child_process";
import { readFileSync } from "fs";
import { parsePandocJson } from "./parse";

export const load = (fileName: string) => {
    const str = readFileSync(fileName).toString();
    const json = JSON.parse(str);
    return parsePandocJson(json);
};

export const callPandoc = (
    source: string,
    inputFormat: string,
    outputFormat: string = "json"
) => {
    return spawnSync("pandoc", ["-f", inputFormat, "-t", outputFormat], {
        input: source,
    })
        .output.filter(x => x)
        .map(x => x.toString())
        .join("");
};
