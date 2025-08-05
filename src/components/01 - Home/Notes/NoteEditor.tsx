import { onCleanup, onMount, createEffect } from "solid-js";
import { EditorView, keymap, drawSelection, highlightSpecialChars, highlightActiveLine, ViewUpdate } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { markdown } from "@codemirror/lang-markdown";
import { GFM } from "@lezer/markdown";
import { oneDark } from "@codemirror/theme-one-dark";
import { syntaxHighlighting, defaultHighlightStyle } from "@codemirror/language";
import { mathPlugin } from "./MathWidget"; // Assuming MathWidget.ts is correct as per your code
import { markdownRenderPlugin } from "./MarkdownRenderPlugin"; // Assuming MarkdownRenderPlugin.ts is correct as per your code

interface Props {
  content: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
}

export default function NoteEditor(props: Props) {
  let editorRef: HTMLDivElement | undefined;
  let view: EditorView | undefined;

  const editorState = EditorState.create({
    doc: props.content,
    extensions: [
      history(),
      markdown({ extensions: [GFM] }),
      oneDark,
      EditorView.lineWrapping,
      drawSelection(),
      highlightActiveLine(),
      highlightSpecialChars(),
      syntaxHighlighting(defaultHighlightStyle, { fallback: true }),

      mathPlugin, // <-- Pass the plugin directly, not mathPlugin()
      markdownRenderPlugin(), // <-- Remove or keep commented

      keymap.of([indentWithTab, ...defaultKeymap, ...historyKeymap]),
      EditorView.updateListener.of((u: ViewUpdate) => {
        if (u.docChanged) {
          props.onChange(u.state.doc.toString());
        }
      }),
      EditorView.domEventHandlers({
        blur: () => props.onBlur?.()
      }),
    ]
  });

  onMount(() => {
    view = new EditorView({
      state: editorState,
      parent: editorRef!,
    });
  });

  createEffect(() => {
    // This effect will react to external changes in props.content
    const currentContent = view?.state.doc.toString();
    if (view && props.content !== currentContent) {
      view.dispatch({
        changes: { from: 0, to: view.state.doc.length, insert: props.content },
      });
    }
  });

  onCleanup(() => {
    view?.destroy();
  });

  return <div ref={editorRef} class="rounded-md w-full h-full [&>div]:h-full" />;
}