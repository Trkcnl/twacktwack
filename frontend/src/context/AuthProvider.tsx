import { useState, useEffect, type ReactNode } from "react";
import api from "../services/api";
import type { User, JWToken } from "../types/auth"; // Ensure these match your file paths
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    // isLoading is crucial: it prevents the app from kicking the user out
    // while it is still checking if a token exists in LocalStorage.
    const [isLoading, setIsLoading] = useState<boolean>(true);

    // 2. Login Action
    const login = async (credentials: object) => {
        // 1. Get the tokens
        const response = await api.post<JWToken>(
            "/api/v1/auth/token/",
            credentials
        );
        const { access, refresh } = response.data;

        // 2. Save to storage
        localStorage.setItem("access", access);
        localStorage.setItem("refresh", refresh);

        // 3. Fetch the user details immediately so the UI updates
        await fetchUser();
    };

    // 3. Logout Action
    const logout = () => {
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        setUser(null);
    };

    // Helper to fetch user profile using the token currently in storage
    const fetchUser = async () => {
        try {
            // Adjust this URL to match your Django "get current user" endpoint
            const response = await api.get<User>("/api/v1/auth/users/me/");
            setUser(response.data);
        } catch (error) {
            console.error("Failed to fetch user", error);
            logout(); // If fetching user fails (e.g. token expired), log them out
        }
    };

    // 1. Initialization Effect
    // Runs once when the app starts. Checks for a token and tries to restore the session.
    useEffect(() => {
        const initializeAuth = async () => {
            const token = localStorage.getItem("access");
            if (token) {
                await fetchUser();
            }
            setIsLoading(false);
        };

        initializeAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <AuthContext.Provider
            value={{ user, isAuthenticated: !!user, isLoading, login, logout }}
        >
            {children}
        </AuthContext.Provider>
    );
};
