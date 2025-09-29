import React from "react";
import ReactDOM from "react-dom/client"; // 👈 très important
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";


const router = createBrowserRouter([
  { path: "/", element: <App /> },
  { path: "/:roomId", element: <App /> },
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
)
