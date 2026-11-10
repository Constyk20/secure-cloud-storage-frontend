import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { DriveProvider } from "./context/DriveContext";
import { FilesProvider } from "./context/FilesContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <DriveProvider>
          <FilesProvider>
            <App />
          </FilesProvider>
        </DriveProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);