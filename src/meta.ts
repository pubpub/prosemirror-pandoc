import { MetaValue, Inline, Block } from "./types";

const extractStringFromInline = (item: Inline): string => {
    if (item.type === "Space") {
        return " ";
    }
    if ("content" in item) {
        if (
            item.type === "Str" ||
            item.type === "Code" ||
            item.type === "RawInline" ||
            item.type === "Math"
        ) {
            return item.content;
        } else {
            if (item.type === "Note") {
                return "";
            } else {
                return extractStringFromInlines(item.content);
            }
        }
    }
    return "";
};

const extractStringFromInlines = (inlines: Inline[]): string => {
    return inlines.map(extractStringFromInline).join("");
};

const extractStringFromBlock = (item: Block): string => {
    if (item.type === "Table") {
        return "";
    }
    if ("content" in item) {
        if (item.type === "RawBlock" || item.type === "CodeBlock") {
            return item.content;
        }
        if (
            item.type === "Para" ||
            item.type === "Plain" ||
            item.type === "Header"
        ) {
            return extractStringFromInlines(item.content);
        }
        if (item.type === "Div" || item.type === "BlockQuote") {
            return extractStringFromBlocks(item.content);
        }
        if (item.type === "LineBlock") {
            return item.content
                .map(inlines => extractStringFromInlines(inlines))
                .join("\n");
        }
        return item.content
            .map(blocks => extractStringFromBlocks(blocks))
            .join("\n");
    }
};

const extractStringFromBlocks = (blocks: Block[]): string => {
    return blocks.map(extractStringFromBlock).join("\n");
};

export const metaValueToString = (m: MetaValue): string => {
    if (m.type === "MetaString") {
        return m.content;
    }
    if (m.type === "MetaBool") {
        return m.content.toString();
    }
    if (m.type === "MetaBlocks") {
        return extractStringFromBlocks(m.content);
    }
    if (m.type === "MetaInlines") {
        return extractStringFromInlines(m.content);
    }
    if (m.type === "MetaList") {
        return m.content.map(metaValueToString).join(", ");
    }
    if (m.type === "MetaMap") {
        return Object.entries(m.values)
            .map(([key, value]) => `${key}: ${metaValueToString(value)}`)
            .join(", ");
    }
    return "";
};

export const metaValueToJsonSerializable = (
    m: MetaValue
): object | any[] | string | boolean => {
    if (m.type === "MetaBool") {
        return m.content;
    }
    if (m.type === "MetaList") {
        return m.content.map(metaValueToJsonSerializable);
    }
    if (m.type === "MetaMap") {
        const entries: [string, any][] = Object.entries(m.values).map(
            ([key, value]) => {
                return [key, metaValueToJsonSerializable(value)];
            }
        );
        const res: { [key: string]: any } = {};
        entries.forEach(entry => {
            const [key, value] = entry;
            res[key] = value;
        });
        return res;
    }
    return metaValueToString(m);
};
