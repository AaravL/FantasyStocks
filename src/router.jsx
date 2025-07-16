import { createBrowserRouter } from "react-router-dom";
import Signup from "./Componenets/Signup";
import Signin from "./Componenets/Signin";
import Dashboard from "./Componenets/Dashboard";
import PrivateRoute from "./Componenets/PrivateRoute";
import CreateProfile from "./Componenets/CreateProfile"; 
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
    { 
        path: "/create-profile", 
        element: <PrivateRoute><CreateProfile /></PrivateRoute>,
    },

]);