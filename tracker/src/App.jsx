import { Routes, Route, Navigate } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import Home from "./pages/home";
import Signin from "./pages/signin";
import Signup from "./pages/signup";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/admin";
import Citizen from "./pages/citizen";
import RequestForm from "./pages/requestform";
import Documents from "./pages/documents";
import Checkout from "./pages/checkout";
import Calendar from "./pages/calendar";
import Receipt from "./pages/receipt";
import Reports from "./pages/reports";
import Feedback from "./pages/feedback";
import EditRequest from "./pages/EditRequest";
import Profile from "./pages/profile";
import AdminRoute from "./routes/AdminRoute";

function App() {
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <Routes>
      {/* Public routes */}
      <Route path="/" element={<Home />} />
      <Route path="/signin" element={<Signin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Citizen routes */}
      <Route path="/citizen" element={<Citizen />} />
      <Route path="/dashboard" element={<Navigate to="/citizen" replace />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/request" element={<RequestForm />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/receipt/:requestId" element={<Receipt />} />
      <Route path="/edit-request/:id" element={<EditRequest />} />
      <Route path="/EditRequest/:id" element={<EditRequest />} />
      <Route path="/profile" element={<Profile />} />

      {/* Admin / Superadmin protected routes */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <Admin />
          </AdminRoute>
        }
      />

      <Route
        path="/reports"
        element={
          <AdminRoute>
            <Reports />
          </AdminRoute>
        }
      />

      <Route
        path="/feedback"
        element={
          <AdminRoute>
            <Feedback />
          </AdminRoute>
        }
      />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </GoogleOAuthProvider>
  );
}

export default App;
