import { lazy } from "solid-js";
import Layout from "@/layout/Layout";

export const routes = [
  {
    path: "/",
    component: (props:any) => <Layout>{props.children}</Layout>,
    children: [

      // 01 - Home
      // { path: "/home", component: lazy(() => import("@/routes/01 - Home/Resources")) },
      { path: "/home/discover", component: lazy(() => import("@/routes/01 - Home/Discover")) },
      { path: "/home/resources", component: lazy(() => import("@/routes/01 - Home/Resources")) },
      { path: "/home/library", component: lazy(() => import("@/routes/01 - Home/Library")) },
      { path: "/home/notes", component: lazy(() => import("@/routes/01 - Home/Notes")) },

      { path: "/home/discover/*", component: lazy(() => import("@/routes/01 - Home/Course")) },
      
      // 02 - Practice
      // { path: "/practice/", component: lazy(() => import("@/routes/02 - Practice/Practice")) },
      { path: "/practice/challenges", component: lazy(() => import("@/routes/02 - Practice/Challenges")) },
      { path: "/practice/games", component: lazy(() => import("@/routes/02 - Practice/Games")) },
      { path: "/practice/training", component: lazy(() => import("@/routes/02 - Practice/Training")) },
      { path: "/practice/tutor", component: lazy(() => import("@/routes/02 - Practice/Tutor")) },

      // 03 - Track
      // { path: "/track/", component: lazy(() => import("@/routes/03 - Track/Track")) },
      { path: "/track/achievements", component: lazy(() => import("@/routes/03 - Track/Achivements")) },
      { path: "/track/goals", component: lazy(() => import("@/routes/03 - Track/Goals")) },
      { path: "/track/insights", component: lazy(() => import("@/routes/03 - Track/Insights")) },
      { path: "/track/time", component: lazy(() => import("@/routes/03 - Track/Time")) },

      // 04 - Tools
      // { path: "/tools/", component: lazy(() => import("@/routes/04 - Tools/Tools")) },
      { path: "/tools/calculators", component: lazy(() => import("@/routes/04 - Tools/Calculators")) },
      { path: "/tools/plugins", component: lazy(() => import("@/routes/04 - Tools/Plugins")) },
      { path: "/tools/pomodoro", component: lazy(() => import("@/routes/04 - Tools/Pomodoro")) },
      { path: "/tools/whiteboard", component: lazy(() => import("@/routes/04 - Tools/Whiteboard")) },
      
      // 05 - Auth
      { path: "/auth/login", component: lazy(() => import("@/routes/05 - Auth/Login")) },
      { path: "/auth/profile", component: lazy(() => import("@/routes/05 - Auth/Profile")) },

      // 06 - Misc
      { path: "/settings", component: lazy(() => import("@/routes/06 - Misc/Settings")) },

      // Catch-all
      { path: "*", component: lazy(() => import("@/routes/06 - Misc/NotFound")) },
    ]
  }

];
