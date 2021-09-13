import { Schema } from "prosemirror-model";
import { tableNodes } from "prosemirror-tables";

const nodes = {
    doc: {
        content: "block+",
        attrs: {
            meta: { default: {} },
        },
    },
    paragraph: {
        content: "inline*",
        group: "block",
        attrs: {
            class: { default: null },
        },
    },
    blockquote: {
        content: "block+",
        group: "block",
    },
    horizontal_rule: {
        group: "block",
    },
    heading: {
        attrs: {
            level: { default: 1 },
            id: { default: "" },
        },
        content: "inline*",
        group: "block",
        defining: true,
    },
    image: {
        atom: true,
        attrs: {
            url: { default: null },
            size: { default: 50 }, // number as percentage
            align: { default: "center" },
            caption: { default: "" },
            altText: { default: "" },
        },
        inline: false,
        group: "block",
    },
    ordered_list: {
        content: "list_item+",
        group: "block",
        attrs: { order: { default: 1 } },
    },
    bullet_list: {
        content: "list_item+",
        group: "block",
    },
    list_item: {
        content: "paragraph block*",
        defining: true,
    },
    code_block: {
        content: "text*",
        group: "block",
    },
    text: {
        inline: true,
        group: "inline",
    },
    hard_break: {
        inline: true,
        group: "inline",
    },
    equation: {
        atom: true,
        inline: true,
        attrs: {
            value: { default: "" },
            html: { default: "" },
        },
        group: "inline",
    },
    block_equation: {
        atom: true,
        attrs: {
            value: { default: "" },
            html: { default: "" },
        },
        inline: false,
        group: "block",
    },
    citation: {
        atom: true,
        attrs: {
            value: { default: "" },
            unstructuredValue: { default: "" },
            count: { default: 0 },
        },
        inline: true,
        group: "inline",
    },
    footnote: {
        atom: true,
        attrs: {
            value: { default: "" },
            structuredValue: { default: "" },
            count: { default: 0 },
        },
        inline: true,
        group: "inline",
    },
    ...tableNodes({
        tableGroup: "block",
        cellContent: "block+",
        cellAttributes: {},
    }),
};

const marks = {
    em: {},
    strong: {},
    link: {
        inclusive: false,
        attrs: {
            href: { default: "" },
            title: { default: null },
            target: { default: null },
        },
    },
    sub: {},
    sup: {},
    strike: {},
    code: {},
};

export const prosemirrorSchema = new Schema({ nodes, marks, topNode: "doc" });
