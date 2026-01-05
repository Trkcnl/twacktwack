import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Layout } from "./pages/Layout";
import { Dashboard } from "./pages/Dashboard";
import { BodyTwacker } from "./pages/BodyTwacker";
import { WorkoutTwacker } from "./pages/WorkoutTwacker";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthProvider";

function App() {
  return (
    // 1. The Router manages the URL history
    <BrowserRouter>
      {/* 2. The AuthProvider gives the "user" state to all pages inside */}
      <AuthProvider>
        <Routes>
          {/* Public Routes: Accessible to anyone */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Wrap all private pages in the Layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              {/* Future pages go here: */}
              {/* <Route path="/settings" element={<Settings />} /> */}
              <Route path="/body_twacker" element={<BodyTwacker />} />
              <Route path="/workout_twacker" element={<WorkoutTwacker />} />
            </Route>
          </Route>

          {/* Catch-all: Redirect unknown URLs to Login or Dashboard */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
