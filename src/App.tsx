import { Router, Route } from "@solidjs/router";

import Titlebar from "@/layout/Titlebar";
import Sidebar from "@/layout/Sidebar";
import Statebar from "@/layout/Statebar";

import { routes } from "@/routes/Routes";

import '@/App.css'
import { getCurrentWindow } from "@tauri-apps/api/window";

async function toggleFullscreen() {
  const appWindow = await getCurrentWindow();
  const isFullscreen = await appWindow.isFullscreen();
  const isMaximized = await appWindow.isMaximized();

  if (!isFullscreen && isMaximized) {
    await appWindow.unmaximize();
    setTimeout(() => {appWindow.setFullscreen(true)}, 50);
  } else {
    appWindow.setFullscreen(!isFullscreen);
  }
}

function App() {

  window.addEventListener("keydown", (e) => {
    if (e.key === "F11") {
      e.preventDefault();
      toggleFullscreen(); // custom function
    }
  });

  return (
    <Router
      root={(props) => (
        <section class="h-screen w-screen overflow-hidden flex">
          <Titlebar />
          <Sidebar />
          <div class="relative overflow-hidden w-full h-full flex flex-col">

            {/* Upper Fade */}
            <div class="absolute bg-background w-full h-4 pointer-events-none" />
            <div class="absolute top-0 left-0 w-full h-min bg-gradient-to-b from-background via-90% to-background/20 z-40 pointer-events-none" />

            {props.children}

            {/* Lower Fade */}
            <div class="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-background via-90% to-background/20 z-40 pointer-events-none" />

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