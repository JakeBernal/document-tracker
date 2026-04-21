import { Routes, Route } from "react-router-dom";
import Signin from "./pages/signin";
import Home from "./pages/home";

import Signup from "./pages/signup";
import Admin from "./pages/admin";
import Citizen from "./pages/citizen";
import AdminRoute from "./routes/AdminRoute";
import RequestForm from "./pages/requestform";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />

        {/* Citizen page */}
        <Route path="/citizen" element={<Citizen />} />
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
      </Routes>
    </>
  );
}

export default App;