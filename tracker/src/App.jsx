import { Routes, Route } from "react-router-dom";
import Signin from "./pages/signin";
import Home from "./pages/home";
import Signup from "./pages/signup";
<<<<<<< HEAD
=======
import RequestForm from "./pages/RequestForm";
import Admin from "./pages/admin";
import Citizen from "./pages/citizen";
import AdminRoute from "./routes/AdminRoute";
>>>>>>> parent of b9a7360 (Revert "rolebasedaccess")

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} />
<<<<<<< HEAD
=======
        <Route path="/request" element={<RequestForm />} />

        {/* Citizen page */}
        <Route path="/citizen" element={<Citizen />} />

        {/* Admin protected route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />
>>>>>>> parent of b9a7360 (Revert "rolebasedaccess")
      </Routes>
    </>
  );
}

export default App;