import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthHook";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading } = useAuth();

  // 1. The Wait:
  // If the auth process is still checking LocalStorage, show a spinner.
  // If we don't wait, the code will rush to step 2, see "isAuthenticated: false",
  // and kick the user out incorrectly.
  if (isLoading) {
    return <div>Loading session...</div>;
  }

  // 2. The Check:
  // If we are done loading and the user is NOT authenticated,
  // redirect them to the login page.
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. The Entry:
  // If authenticated, render the child route (e.g., Dashboard)
  // The <Outlet /> component is a placeholder for the child routes defined in App.tsx
  return <Outlet />;
};
