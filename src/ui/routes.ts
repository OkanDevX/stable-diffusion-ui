import { createHashRouter } from "react-router";

// ----------------------------------------------------------------
// Root
// ----------------------------------------------------------------
import Root from "./Root";

// ----------------------------------------------------------------
// Layout Imports
// ----------------------------------------------------------------
import MainLayout from "./components/layouts/MainLayout";

// ----------------------------------------------------------------
// Screen Imports
// ----------------------------------------------------------------
import MainScreen from "./screens/MainScreen";
import LoadingScreen from "./screens/LoadingScreen";

// ----------------------------------------------------------------
// Router Config
// ----------------------------------------------------------------
const router = createHashRouter([
  {
    Component: Root,
    children: [
      {
        path: "/loading",
        Component: LoadingScreen,
      },
      {
        Component: MainLayout,
        children: [
          {
            path: "/",
            Component: MainScreen,
            index: true,
          },
        ],
      },
    ],
  },
]);

export default router;
