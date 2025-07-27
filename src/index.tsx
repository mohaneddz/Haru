/* @refresh reload */
import { render } from "solid-js/web";
import App from "./App";
import '@/style/Index.css';
import '@/style/App.css';
import '@/style/Components.css';

render(() => <App />, document.getElementById("root") as HTMLElement);
