import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";

export const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50 text-gray-900">
            {/* The Navbar stays fixed at the top */}
            <Navbar />

            {/* The "Main" content area grows to fill the space */}
            <main className="flex-1 container mx-auto px-4 py-8">
                <Outlet />
            </main>

            <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
                &copy; {new Date().getFullYear()} MyApp Corp. All rights
                reserved.
            </footer>
        </div>
    );
};
