import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthHook";

export const Navbar = () => {
  const { user, logout } = useAuth();

  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Helper class for links
  // This function decides if the link is active or not and applies different styles
  const getLinkClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-blue-200 font-semibold border-b-2 border-blue-200 pb-1" // Active Style
      : "text-gray-300 hover:text-white transition-colors pb-1"; // Inactive Style

  return (
    <nav className="bg-slate-800 text-white shadow-md text-xl">
      <div className="container mx-auto px-4 py-4  flex items-center justify-between">
        <div className="flex items-center gap-12">
          <div className="md:flex gap-8">
            <Link
              to="/dashboard"
              className="hover:text-blue-300 transition-colors"
            >
              <img
                src={"src/assets/twacktwacklogo.png"}
                alt="App Logo"
                className="h-16 w-auto"
              />
            </Link>
          </div>
          {user && (
            <div className="hidden md:flex gap-8">
              <NavLink to="/dashboard" className={getLinkClass}>
                Dashboard
              </NavLink>

              <NavLink to="/body_twacker" className={getLinkClass}>
                Body Twacker
              </NavLink>

              <NavLink to="/workout_twacker" className={getLinkClass}>
                Workout Twacker
              </NavLink>
            </div>
          )}
        </div>

        {/* RIGHT SIDE (User Profile) */}
        <div className="flex items-center gap-6">
          {user ? (
            <>
              <Link to={"/profile"} className="text-slate-300 hidden sm:block">
                {user.username}
              </Link>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded font-medium transition-colors"
              >
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded "
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};
