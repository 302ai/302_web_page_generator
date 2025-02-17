import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { Toaster } from "react-hot-toast";
// import EvalsPage from "./components/evals/EvalsPage.tsx";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { GlobalProvider } from "./components/global-provider.tsx";
import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import 'react-toastify/dist/ReactToastify.css';
import ScriptLoader from "./ScriptLoader.tsx";
import '../i18n.js'

ReactDOM.createRoot(document.getElementById("root")!).render(
  <GlobalProvider>
    <Theme>
      <React.StrictMode>
        <ScriptLoader />
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            {/* <Route path="/evals" element={<EvalsPage />} /> */}
          </Routes>
        </Router>
        <Toaster
          toastOptions={{ className: "dark:bg-zinc-950 dark:text-white" }}
        />
      </React.StrictMode>
    </Theme>
  </GlobalProvider>
);
