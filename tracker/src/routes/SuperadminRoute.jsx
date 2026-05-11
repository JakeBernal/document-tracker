import { Navigate } from "react-router-dom";

export default function SuperadminRoute({ children }) {
  const token = localStorage.getItem("token");
  let user = null;

  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    return <Navigate to="/signin" replace />;
  }

  if (!token || !user) {
    return <Navigate to="/signin" replace />;
  }

  if (user.role !== "superadmin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
