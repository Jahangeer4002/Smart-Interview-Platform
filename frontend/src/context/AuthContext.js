import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL + "/api";

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    delete axios.defaults.headers.common["Authorization"];
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error("Failed to fetch current user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, [token, fetchCurrentUser]);

  const login = async (email, password) => {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });

    const { access_token, user: userData } = response.data;

    setToken(access_token);
    setUser(userData);

    localStorage.setItem("token", access_token);

    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

    return userData;
  };

  const register = async (email, password, full_name, role) => {
    const response = await axios.post(`${API_URL}/auth/register`, {
      email,
      password,
      full_name,
      role,
    });

    const { access_token, user: userData } = response.data;

    setToken(access_token);
    setUser(userData);

    localStorage.setItem("token", access_token);

    axios.defaults.headers.common["Authorization"] = `Bearer ${access_token}`;

    return userData;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
