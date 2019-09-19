export const nodes = {
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
};

export const marks = {
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
