import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  let user = null;
  const token = localStorage.getItem("token");

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/signin" replace />;
  }

  if (!user || !token) {
    return <Navigate to="/signin" replace />;
  }

  const isAdminUser = user.role === "admin" || user.role === "superadmin";

  if (!isAdminUser) {
    return <Navigate to="/citizen" replace />;
  }

  return children;
}
