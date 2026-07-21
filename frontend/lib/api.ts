import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to inject Access Token into request headers
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("accessToken");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Interceptor to handle Token Refresh automatically on 401 response
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (!error.response || error.response.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = typeof window !== "undefined" ? localStorage.getItem("refreshToken") : null;

    if (!refreshToken) {
      isRefreshing = false;
      // Force logout if no refresh token
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login?expired=true";
      }
      return Promise.reject(error);
    }

    try {
      // Call token refresh API
      const res = await axios.post(`${API_URL}/api/auth/refresh`, {
        refreshToken: refreshToken,
      });

      const { accessToken: newAccess, refreshToken: newRefresh } = res.data;

      if (typeof window !== "undefined") {
        localStorage.setItem("accessToken", newAccess);
        localStorage.setItem("refreshToken", newRefresh);
      }

      // Reconfigure authorization header
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
      }

      processQueue(null, newAccess);
      isRefreshing = false;

      return api(originalRequest);
    } catch (refreshErr) {
      processQueue(refreshErr, null);
      isRefreshing = false;

      // Clean storage and log out
      if (typeof window !== "undefined") {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/login?expired=true";
      }
      return Promise.reject(refreshErr);
    }
  }
);
