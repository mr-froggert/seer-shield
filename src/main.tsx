import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { App } from "./App";
import { AppPreferencesProvider } from "./context/AppPreferencesContext";
import "./styles.css";

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppPreferencesProvider>
        <App />
        <ReactQueryDevtools initialIsOpen={false} />
      </AppPreferencesProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
