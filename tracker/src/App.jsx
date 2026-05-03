import { Routes, Route, Navigate } from "react-router-dom";

import Home from "./pages/home";
import Signin from "./pages/signin";
import Signup from "./pages/signup";
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
      <Route path="/dashboard" element={<Navigate to="/citizen" replace />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/request" element={<RequestForm />} />
      <Route path="/checkout" element={<Checkout />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/receipt/:requestId" element={<Receipt />} />
      <Route path="/edit-request/:id" element={<EditRequest />} />
      <Route path="/EditRequest/:id" element={<EditRequest />} />

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
  );
}

export default App;
