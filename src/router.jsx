import { createBrowserRouter } from "react-router-dom";
import Signup from "./Components/Signup";
import Signin from "./Components/Signin";
import Dashboard from "./Components/Dashboard";
import PrivateRoute from "./Components/PrivateRoute";
import App from "./App";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <App />,
    },
    {
        path: "/signup",
        element: <Signup />,
    },
    {
        path: "/signin",
        element: <Signin />,
    },
    {
        path: "/dashboard",
        element: <PrivateRoute><Dashboard /> </PrivateRoute>,
    },
]);                