import axios from "axios";

// Create axios instance
const baseURL = import.meta.env.VITE_API_URL || "https://veda-kx60.onrender.com/api";

if (!import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL is not defined in .env, falling back to https://veda-kx60.onrender.com/api");
}

const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
  credentials: 'include'
});

api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("user");
      localStorage.removeItem("lastLoginTime");
      window.location.href = "/auth-user";
    }
    return Promise.reject(error);
  }
);

export default api;
