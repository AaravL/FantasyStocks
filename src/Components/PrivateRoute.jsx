import React from 'react'
import { UserAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';

const PrivateRoute = (props) => {
    const { session } = UserAuth();
    const { children } = props;

    if (session === undefined) {
        return <p>Loading...</p>;
    }

    return <>{session ? <>{children}</> : <Navigate to="/signup" />}</>;
};

export default PrivateRoute;