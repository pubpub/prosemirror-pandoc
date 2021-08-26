import fs from "fs";
import { argv } from "yargs";
import { parsePandocJson } from "../parse";

const main = async () => {
    const {
        _: [filePath],
    } = argv;
    const fileJson = JSON.parse(fs.readFileSync(filePath).toString());
    const parsed = parsePandocJson(fileJson);
    console.log(JSON.stringify(parsed));
};

main().catch((e) => console.error(e));
