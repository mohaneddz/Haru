import { Router, Route } from "@solidjs/router";

import Titlebar from "@/layout/Titlebar";
import Sidebar from "@/layout/Sidebar";
import Statebar from "@/layout/Statebar";

import {routes} from "@/routes/Routes";

import '@/App.css'



function App() {
  return (
    <Router
      root={(props) => (
        <section class="h-screen w-screen overflow-hidden flex">
          <Titlebar />
          <Sidebar />
          <div class="relative overflow-hidden w-full h-full flex flex-col">
            {props.children}
            <Statebar />
          </div>
        </section>
      )}
    >
      {routes.map(({ path, component: C, children }) => (
        <Route path={path} component={C}>
          {children?.map(({ path, component }) => (
            <Route path={path} component={component} />
          ))}
        </Route>
      ))}
    </Router>
  );
}

export default App;
