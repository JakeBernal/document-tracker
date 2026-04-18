import { Routes, Route } from "react-router-dom";
import Signin from "./pages/signin";
import Home from "./pages/home";
<<<<<<< HEAD
import Signup from "./pages/signup";
import RequestForm from "./pages/RequestForm";
import Admin from "./pages/admin";
import Citizen from "./pages/citizen";
import AdminRoute from "./routes/AdminRoute";
=======
import Signup from "./pages/signup"
>>>>>>> parent of 84f8b15 (Initial commit)

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
<<<<<<< HEAD
        <Route path="/signup" element={<Signup />} />
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
=======
        <Route path="/signup" element={<Signup />} /> 
>>>>>>> parent of 84f8b15 (Initial commit)
      </Routes>
    </>
  );
}

export default App;