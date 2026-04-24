import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home";
import Signin from "./pages/signin";
import Signup from "./pages/signup";
import Admin from "./pages/admin";
import Citizen from "./pages/citizen";
import RequestForm from "./pages/requestform";
import Documents from "./pages/documents";

import AdminRoute from "./routes/AdminRoute";

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />

      {/* Citizen routes */}
      <Route path="/citizen" element={<Citizen />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/request" element={<RequestForm />} />

      {/* Admin protected route */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;