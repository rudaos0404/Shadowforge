import { createBrowserRouter, RouterProvider } from "react-router-dom";
import TitlePage from "../pages/TitlePage";
import LobbyPage from "../pages/LobbyPage";
import TurnPage from "../pages/TurnPage";
import ShopPage from "../pages/ShopPage";
import RestPage from "../pages/RestPage";
import TreasurePage from "../pages/TreasurePage";
import BattlePage from "../pages/BattlePage";
import GuidePage from "../pages/GuidePage";

const router = createBrowserRouter([
  { path: "/", element: <TitlePage /> },
  { path: "/lobby", element: <LobbyPage /> },
  { path: "/turn", element: <TurnPage /> },
  { path: "/shop", element: <ShopPage /> },
  { path: "/rest", element: <RestPage /> },
  { path: "/treasure", element: <TreasurePage /> },
  { path: "/battle", element: <BattlePage /> },
  { path: "/guide", element: <GuidePage /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
