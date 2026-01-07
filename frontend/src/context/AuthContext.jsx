import React, { createContext, useContext, useState, useEffect } from "react";
import Cookies from "js-cookie";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkSession = () => {
            const storedUser = localStorage.getItem("user");
            const lastLoginTime = localStorage.getItem("lastLoginTime");

            if (storedUser && lastLoginTime) {
                const now = new Date().getTime();
                const lastLogin = parseInt(lastLoginTime);
                const hoursSinceLastLogin = (now - lastLogin) / (1000 * 60 * 60);

                if (hoursSinceLastLogin > 24) {
                    localStorage.removeItem("user");
                    localStorage.removeItem("lastLoginTime");
                    setUser(null);
                } else {
                    try {
                        setUser(JSON.parse(storedUser));
                    } catch (error) {
                        console.error("Failed to parse user from local storage", error);
                        localStorage.removeItem("user");
                    }
                }
            }
            setLoading(false);
        };

        checkSession();
    }, []);

    const login = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem("user");
        Cookies.remove("token"); // Assuming you might want to clear cookies too
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading, updateUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
