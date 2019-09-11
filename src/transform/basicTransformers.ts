/*
 * A transformer appropriate for simple container nodes. Typically, these  are
 * correspondences between Pandoc elements with a content property and
 * Prosemirror elements with a children property
 */
export const contentTransformer = (pdNodeName: string, pmNodeName: string) => {
    return {
        fromPandoc: (node: { content: any[] }, { fromPandoc }) => {
            return {
                type: pmNodeName,
                children: node.content.map(fromPandoc),
            };
        },
        fromProsemirror: (node: { children: any[] }, { fromProsemirror }) => {
            return {
                type: pdNodeName,
                content: node.children.map(fromProsemirror),
            };
        },
    };
};

/*
 * A transformer that converts between Pandoc elements with string content and Prosemirror
 * elements that accept {type: 'text', text: string}[] as their children.
 */
export const textTransformer = (pdNodeName: string, pmNodeName: string) => {
    return {
        fromPandoc: (node: { content: string }) => {
            return {
                type: pmNodeName,
                children: [
                    {
                        type: "text",
                        text: node.content,
                    },
                ],
            };
        },
        fromProsemirror: (node: { children: { text: string }[] }) => {
            return {
                type: pdNodeName,
                content: node.children.join(""),
            };
        },
    };
};

/*
 * A transformer appropriate for converting between Pandoc OrderedLists and BulletLists and the
 * equivalent types in a Prosemirror schema -- basically, anything like an <ol> or a <ul>.
 */
export const listTransformer = (pmInnerNodeName: string) => (pdNodeName: string, pmNodeName: string) => {
    
}