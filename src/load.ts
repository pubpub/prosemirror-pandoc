import { readFileSync } from "fs";
import { parsePandocJson } from "./parse";

export const load = (fileName: string) => {
    const str = readFileSync(fileName).toString();
    const json = JSON.parse(str);
    return parsePandocJson(json);
};
