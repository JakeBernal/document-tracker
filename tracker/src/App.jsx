import { Routes, Route } from "react-router-dom";
import Signin from "./pages/signin";
import Home from "./pages/home";
import Signup from "./pages/signup"
import RequestForm from "./pages/RequestForm";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/signin" element={<Signin />} />
        <Route path="/signup" element={<Signup />} /> 
        <Route path="/request" element={<RequestForm />} />
      </Routes>
    </>
  );
}

export default App;