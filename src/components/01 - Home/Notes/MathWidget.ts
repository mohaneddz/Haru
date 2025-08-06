import {
  ViewPlugin,
  ViewUpdate,
  Decoration,
  DecorationSet,
  WidgetType,
} from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";
import katex from "katex";

// Make sure to import the KaTeX CSS file in your project
// for the rendered math to be styled correctly.
import "katex/dist/katex.min.css";

class MathWidget extends WidgetType {
  constructor(readonly latex: string, readonly isBlock: boolean) {
    super();
  }

  toDOM() {
    const container = document.createElement("span");
    container.className = "cm-math";
    if (this.isBlock) {
      container.style.display = "block";
      container.style.width = "100%";
      container.style.textAlign = "center";
    }

    try {
      katex.render(this.latex, container, {
        displayMode: this.isBlock,
        throwOnError: false,
      });
    } catch (e) {
      container.textContent = this.latex;
      const errorEl = container.appendChild(document.createElement("div"));
      errorEl.className = "cm-math-error";
      errorEl.textContent = e instanceof Error ? e.message : String(e);
    }
    return container;
  }

  ignoreEvent() {
    return true;
  }
}

function findAndDecorateMath(view: any): DecorationSet {
  // Collect decorations in an array first
  const decorationsArr: Array<{ from: number; to: number; deco: Decoration }> = [];
  const docString = view.state.doc.toString();
  const { from, to } = view.state.selection.main;

  // Find and decorate block math ($$...$$)
  const blockRegex = /\$\$([\s\S]+?)\$\$/g;
  let match;
  const blockRanges: Array<{ start: number; end: number }> = [];
  while ((match = blockRegex.exec(docString))) {
    const start = match.index;
    const end = start + match[0].length;
    const latex = match[1];

    blockRanges.push({ start, end });

    if (from > end || to < start) {
      decorationsArr.push({
        from: start,
        to: end,
        deco: Decoration.replace({
          widget: new MathWidget(latex, true),
        }),
      });
    }
  }

  // Find and decorate inline math ($...$)
  const inlineRegex = /\$([^$]+)\$/g;
  for (let i = 1; i <= view.state.doc.lines; i++) {
    const line = view.state.doc.line(i);
    while ((match = inlineRegex.exec(line.text))) {
      const start = line.from + match.index;
      const end = start + match[0].length;
      const latex = match[1];

      // Check if already inside a block decoration
      let isInsideBlock = blockRanges.some(
        (range) => start >= range.start && end <= range.end
      );
      if (isInsideBlock) continue;

      if (from > end || to < start) {
        decorationsArr.push({
          from: start,
          to: end,
          deco: Decoration.replace({
            widget: new MathWidget(latex, false),
          }),
        });
      }
    }
  }

  // Sort decorations by 'from' position
  decorationsArr.sort((a, b) => a.from - b.from);

  // Add sorted decorations to RangeSetBuilder
  const decorations = new RangeSetBuilder<Decoration>();
  for (const { from, to, deco } of decorationsArr) {
    decorations.add(from, to, deco);
  }

  return decorations.finish();
}

export const mathPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: any) {
      this.decorations = findAndDecorateMath(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged || update.selectionSet) {
        this.decorations = findAndDecorateMath(update.view);
      }
    }
  },
  {
    decorations: (v) => v.decorations,
  }
);