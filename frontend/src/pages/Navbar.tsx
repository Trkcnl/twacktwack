import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthHook";

export const Navbar = () => {
    const { user, logout } = useAuth();

    return (
        <nav className="bg-slate-800 text-white shadow-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Left Side: Logo/Brand */}
                <div className="font-bold text-xl tracking-tight">
                    <Link to="/dashboard" className="hover:text-blue-300 transition-colors">
                        TwackTwack
                    </Link>
                </div>

                {/* Right Side: User Info & Actions */}
                <div className="flex items-center gap-6">
                    {user ? (
                        <>
                            <span className="text-slate-300 text-sm hidden sm:block">
                                Welcome, <span className="font-semibold text-white">{user.username}</span>
                            </span>
                            
                            <button 
                                onClick={logout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        <Link 
                            to="/login" 
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
};