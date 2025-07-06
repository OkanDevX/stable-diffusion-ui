import { Outlet } from "react-router";

import "./index.css";
import ReactQueryProvider from "./components/providers/react-query-provider";

function Root() {
  return (
    <ReactQueryProvider>
      <Outlet />
    </ReactQueryProvider>
  );
}

export default Root;
