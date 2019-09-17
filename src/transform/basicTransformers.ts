/*
 * A transformer appropriate for simple container nodes. Typically, these  are
 * correspondences between Pandoc elements with a content property and
 * Prosemirror elements with a children property
 */
export const contentTransformer = (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: (node, { transform }) => {
            return {
                type: pmNodeName,
                children: transform(node.content),
            };
        },
        fromProsemirror: (node, { transform }) => {
            return {
                type: pdNodeName,
                content: transform(node.children),
            };
        },
    };
};

/*
 * A transformer that converts between Pandoc elements with string content and Prosemirror
 * elements that accept {type: 'text', text: string}[] as their children.
 */
export const textTransformer = (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: node => {
            return {
                type: pmNodeName,
                text: node.content,
            };
        },
        fromProsemirror: node => {
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
export const listTransformer = (
    pmInnerNodeName: string,
    processListItem: <N>(n: N) => N = x => x
) => (pdNodeName, pmNodeName) => {
    return {
        fromPandoc: (node, { transform }) => {
            const children = node.content.map(blocks => {
                return processListItem({
                    type: pmInnerNodeName,
                    children: transform(blocks).asArray(),
                });
            });
            const hasOrder =
                node.listAttributes &&
                typeof node.listAttributes.startNumber === "number";
            const attrs = hasOrder
                ? { order: node.listAttributes.startNumber }
                : {};
            return {
                type: pmNodeName,
                attrs,
                children,
            };
        },
        fromProsemirror: (node, { transform }) => {
            const content = node.children.map(listItem =>
                transform(listItem).asArray()
            );
            const additionalAttributes =
                typeof node.attrs.order === "number"
                    ? {
                          listAttributes: {
                              startNumber: node.attrs.order,
                              listNumberStyle: "DefaultStyle",
                              listNumberDelim: "DefaultDelim",
                          },
                      }
                    : {};
            return {
                type: pdNodeName,
                content,
                ...additionalAttributes,
            };
        },
    };
};
