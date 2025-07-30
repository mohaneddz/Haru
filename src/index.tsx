/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";

import '@/style/components/Components.css';
import '@/style/components/Excalidraw.css';
import '@/style/components/FileTree.css';
import '@/style/components/Editor.css';

import '@/style/core/App.css';
import '@/style/core/Basic.css';
import '@/style/core/Index.css';
import '@/style/core/Base.css';

import '@/style/typography/Headings.css';
import '@/style/typography/Text.css';
import '@/style/typography/Typography.css';

import '@/style/ui/Scrollbar.css';
import '@/style/ui/Titlebar.css';

import 'katex/dist/katex.min.css'

render(() => <App />, document.getElementById("root") as HTMLElement);
