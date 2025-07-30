import {
  Decoration,
  DecorationSet,
  EditorView,
  WidgetType,
} from "@codemirror/view";
import { syntaxTree } from "@codemirror/language";
import { SyntaxNode } from "@lezer/common";
import { RangeSetBuilder, EditorState, StateField } from "@codemirror/state";

// ===================================================================
// WIDGETS
// ===================================================================

// A new widget for the copy button on code blocks
class CodeBlockCopyButton extends WidgetType {
  constructor(readonly code: string) {
    super();
  }

  toDOM() {
    const button = document.createElement("button");
    button.className = "cm-code-block-copy-button";
    button.innerText = "Copy";
    button.addEventListener("click", () => {
      navigator.clipboard.writeText(this.code).then(() => {
        button.innerText = "Copied!";
        setTimeout(() => {
          button.innerText = "Copy";
        }, 2000);
      });
    });
    return button;
  }

  ignoreEvent() {
    return true;
  }
}

class CodeBlockWidget extends WidgetType {
  constructor(readonly code: string, readonly lang: string) {
    super();
  }

  toDOM() {
    const container = document.createElement("div");
    container.className = "cm-rendered-code-block";

    const header = document.createElement("div");
    header.className = "cm-code-block-header";

    const langTag = document.createElement("div");
    langTag.className = "cm-code-block-lang";
    langTag.innerText = this.lang || "text"; // Default to 'text' if no language
    header.appendChild(langTag);

    // The copy button is added here as a Decoration, not directly in the DOM
    // This will be handled by the main decoration logic.

    container.appendChild(header);

    const pre = document.createElement("pre");
    const codeEl = document.createElement("code");
    codeEl.innerText = this.code;
    pre.appendChild(codeEl);
    container.appendChild(pre);

    return container;
  }

  ignoreEvent() {
    return true;
  }
}

// Other widgets (Table, HorizontalRule) remain unchanged...
class TableWidget extends WidgetType {
    constructor(readonly tableRows: string[][]) { super(); }
    toDOM() {
      const table = document.createElement("table");
      table.className = "cm-rendered-table";
      const thead = table.createTHead();
      const headerRow = thead.insertRow();
      if (this.tableRows.length > 0) {
        this.tableRows[0].forEach(headerText => {
          const th = document.createElement("th");
          th.innerHTML = headerText;
          headerRow.appendChild(th);
        });
      }
      const tbody = table.createTBody();
      this.tableRows.slice(1).forEach(rowText => {
        const tr = tbody.insertRow();
        rowText.forEach(cellText => {
          const td = tr.insertCell();
          td.innerHTML = cellText;
          tr.appendChild(td);
        });
      });
      return table;
    }
    ignoreEvent() { return true; }
  }
  
  class HorizontalRuleWidget extends WidgetType {
    toDOM() {
      const el = document.createElement("div");
      el.className = "cm-rendered-hr";
      return el;
    }
    ignoreEvent() { return true; }
  }


// ===================================================================
// HELPER FUNCTIONS (Unchanged)
// ===================================================================
function parseRow(state: EditorState, node: SyntaxNode): string[] {
    const cells: string[] = [];
    let child = node.firstChild;
    while (child) {
      if (child.name === 'TableCell') {
        cells.push(state.doc.sliceString(child.from, child.to).trim());
      }
      child = child.nextSibling;
    }
    return cells;
  }


// ===================================================================
// DECORATION BUILDER (WITH LISTS AND COPY BUTTON)
// ===================================================================
function buildDecorations(state: EditorState): DecorationSet {
  const decorations: { from: number; to: number; deco: Decoration }[] = [];
  const { from: selectionFrom, to: selectionTo } = state.selection.main;

  const isRangeSelected = (from: number, to: number) => {
    return selectionFrom <= to && selectionTo >= from;
  };

  syntaxTree(state).iterate({
    enter: (node) => {
      const isSelected = isRangeSelected(node.from, node.to);

      // --- WIDGET-BASED REPLACEMENTS ---
      if (!isSelected) {
        if (node.name === "Table") {
            const tableRows: string[][] = [];
            const headerNode = node.node.getChild('TableHeader');
            if (headerNode) {
              tableRows.push(parseRow(state, headerNode));
              let child = headerNode.nextSibling;
              while (child) {
                if (child.name === 'TableRow') {
                  tableRows.push(parseRow(state, child));
                }
                child = child.nextSibling;
              }
              decorations.push({ from: node.from, to: node.to, deco: Decoration.widget({ widget: new TableWidget(tableRows), block: true }) });
              return false;
            }
          }

        if (node.name === "FencedCode") {
          const langNode = node.node.getChild("CodeInfo");
          const lang = langNode ? state.doc.sliceString(langNode.from, langNode.to) : "";
          const codeContentNode = node.node.getChild("CodeText");
          const code = codeContentNode ? state.doc.sliceString(codeContentNode.from, codeContentNode.to) : "";
          
          decorations.push({
            from: node.from,
            to: node.to,
            deco: Decoration.replace({
                widget: new CodeBlockWidget(code, lang),
                block: true
            })
          });

          // Add the copy button widget to the end of the code block's first line
          const firstLine = state.doc.lineAt(node.from);
          decorations.push({
            from: firstLine.to,
            to: firstLine.to,
            deco: Decoration.widget({
                widget: new CodeBlockCopyButton(code),
                side: 1 // Place it to the right of the content
            })
          });

          return false;
        }

        if (node.name === "HorizontalRule") {
          decorations.push({ from: node.from, to: node.to, deco: Decoration.widget({ widget: new HorizontalRuleWidget() }) });
          return false;
        }
      }

      // --- REGULAR DECORATIONS ---

      // Handle Lists (Unordered and Ordered)
      if (node.name === "ListItem") {
        decorations.push({
          from: node.from,
          to: node.from,
          deco: Decoration.line({
            class: "cm-list-item"
          })
        });

        // Hide the list marker (e.g., '-', '*', '1.') when not selected
        if (!isSelected) {
            const listMark = node.node.firstChild;
            if(listMark && listMark.name === "ListMark"){
                decorations.push({
                    from: listMark.from,
                    to: listMark.to,
                    deco: Decoration.replace({})
                });
            }
        }
      }

      const processInlineMarks = (markClass: string) => {
        const startMark = node.node.firstChild;
        const endMark = node.node.lastChild;
        if (!startMark || !endMark || startMark.from >= endMark.from) return;
        decorations.push({ from: startMark.to, to: endMark.from, deco: Decoration.mark({ class: markClass }) });
        if (!isSelected) {
          decorations.push({ from: startMark.from, to: startMark.to, deco: Decoration.replace({}) });
          decorations.push({ from: endMark.from, to: endMark.to, deco: Decoration.replace({}) });
        }
      };
      
      if (node.name === "StrongEmphasis") processInlineMarks("cm-strong");
      if (node.name === "Emphasis") processInlineMarks("cm-em");
      if (node.name === "Strikethrough") processInlineMarks("cm-strikethrough");
      if (node.name === "InlineCode") processInlineMarks("cm-inline-code");

      // Distinguish Inline Code from Code in Fenced Blocks
      if (node.name === "CodeText" && !node.node.parent?.name.includes("Fenced")) {
        decorations.push({ from: node.from, to: node.to, deco: Decoration.mark({ class: "cm-inline-code" }) });

        // This hides the backticks ` `
        if (!isSelected) {
            decorations.push({ from: node.from, to: node.from + 1, deco: Decoration.replace({}) });
            decorations.push({ from: node.to - 1, to: node.to, deco: Decoration.replace({}) });
        }
      }
      
      if (node.name.startsWith("ATXHeading")) {
        const level = node.name.slice(-1);
        decorations.push({ from: node.from, to: node.from, deco: Decoration.line({ class: `cm-rendered-h${level}` }) });
        if (!isSelected) {
          const mark = node.node.getChild("HeaderMark");
          if (mark) decorations.push({ from: mark.from, to: mark.to, deco: Decoration.replace({}) });
        }
      }
    },
  });

  decorations.sort((a, b) => a.from - b.from);
  const builder = new RangeSetBuilder<Decoration>();
  for (const { from, to, deco } of decorations) {
    builder.add(from, to, deco);
  }
  return builder.finish();
}


// ===================================================================
// PLUGIN EXPORT (StateField - Unchanged)
// ===================================================================
export const markdownRenderPlugin = () => StateField.define<DecorationSet>({
  create(state) {
    return buildDecorations(state);
  },
  update(decorations, tr) {
    if (tr.docChanged || tr.selection) {
      return buildDecorations(tr.state);
    }
    return decorations.map(tr.changes);
  },
  provide(field) {
    return EditorView.decorations.from(field);
  },
});