import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true
});

let refreshHandler = null;
let setAccessTokenCallback = null;

// Allow the AuthContext to subscribe to access token changes
export const registerAccessTokenSetter = (callback) => {
  setAccessTokenCallback = callback;
};

axiosInstance.interceptors.request.use(
  (config) => {
    // Read the access token from the global window in-memory cache
    const token = window.__accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if 401 and not a retry and not auth routes
    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        // Debounce multiple parallel refresh triggers
        if (!refreshHandler) {
          refreshHandler = axios.post(
            `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
            {},
            { withCredentials: true }
          );
        }

        const res = await refreshHandler;
        refreshHandler = null;

        const { accessToken } = res.data;

        // Store new access token in-memory
        window.__accessToken = accessToken;
        if (setAccessTokenCallback) {
          setAccessTokenCallback(accessToken);
        }

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshErr) {
        refreshHandler = null;
        window.__accessToken = null;
        if (setAccessTokenCallback) {
          setAccessTokenCallback(null);
        }
        return Promise.reject(refreshErr);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
