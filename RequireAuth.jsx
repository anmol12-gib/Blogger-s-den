import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    // redirect to login and remember where user wanted to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
