import { createBrowserRouter, RouterProvider, type RouteObject } from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { NotFoundPage } from "./pages/NotFoundPage";
import { CoreAssetDetailPage } from "./pages/CoreAssetDetailPage";
import { CoreAssetsPage } from "./pages/CoreAssetsPage";
import { ProtocolDetailPage } from "./pages/ProtocolDetailPage";
import { ProtocolsPage } from "./pages/ProtocolsPage";
import { StablecoinDetailPage } from "./pages/StablecoinDetailPage";
import { StablecoinsPage } from "./pages/StablecoinsPage";
import { TokenizedBtcDetailPage } from "./pages/TokenizedBtcDetailPage";
import { TokenizedBtcPage } from "./pages/TokenizedBtcPage";

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        index: true,
        element: <ProtocolsPage />
      },
      {
        path: "stablecoins",
        element: <StablecoinsPage />
      },
      {
        path: "core-assets",
        element: <CoreAssetsPage />
      },
      {
        path: "core-assets/:id",
        element: <CoreAssetDetailPage />
      },
      {
        path: "stablecoins/:id",
        element: <StablecoinDetailPage />
      },
      {
        path: "tokenized-btc",
        element: <TokenizedBtcPage />
      },
      {
        path: "tokenized-btc/:id",
        element: <TokenizedBtcDetailPage />
      },
      {
        path: "protocols/:id",
        element: <ProtocolDetailPage />
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
];

const router = createBrowserRouter(appRoutes);

export function App() {
  return <RouterProvider router={router} />;
}
