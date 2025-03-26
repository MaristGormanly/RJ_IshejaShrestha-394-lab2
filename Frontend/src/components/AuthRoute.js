import React from 'react';
import { Navigate } from 'react-router-dom';

const AuthRoute = ({ user, children }) => {
  if (!user) {
    return <Navigate to="/login" />;
  }

  return children;
};

export default AuthRoute; 