import React, { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [user, setUser] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const API_BASE_URL = "http://127.0.0.1:8000/api"; // غيّره لو تستخدم localhost

  // =============== جلب بروفايل المستخدم ===============
  const fetchUser = async (tok) => {
    if (!tok) return;
    try {
      setLoadingProfile(true);
      const res = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          Authorization: `Bearer ${tok}`,
          Accept: "application/json",
        },
      });

      const data = await res.json().catch(() => null);
      console.log("Profile response:", res.status, data);

      if (res.ok && data?.user) {
        // data = { user: {...}, role: "student" }
        setUser(data);
        setLoadingProfile(false);
        return data;
      } else {
        setUser(null);
        setLoadingProfile(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setLoadingProfile(false);
    }
  };

  // =============== تسجيل الدخول ===============
  const login = async (newToken) => {
    setToken(newToken);
    localStorage.setItem("token", newToken);
    await fetchUser(newToken);
  };

  // =============== تسجيل الخروج ===============
  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
  };

  // عند فتح الصفحة أو وجود توكن مخزّن، نجلب البروفايل تلقائيًا
  useEffect(() => {
    if (token && !user) {
      fetchUser(token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <AuthContext.Provider
      value={{
        token,
        user, // فيه { user: {...}, role: "student" }
        login,
        logout,
        isAuthenticated: !!token,
        loadingProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
