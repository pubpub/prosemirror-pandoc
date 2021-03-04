import { argv } from "yargs";
import { loadAndTransformFromPandoc } from "../util";
import rules from "./rules";

const main = async () => {
    const {
        _: [filePath],
    } = argv;
    console.log(JSON.stringify(loadAndTransformFromPandoc(filePath, rules)));
};

main().catch(e => console.error(e));
