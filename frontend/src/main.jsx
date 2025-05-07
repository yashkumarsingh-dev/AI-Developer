import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import "./index.css";
import "remixicon/fonts/remixicon.css";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
);
