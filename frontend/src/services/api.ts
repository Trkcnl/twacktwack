import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    if (!error.response) {
      alert("Network Error");

      return Promise.reject(error);
    }
    const statusCode = error.response.status;
    const errorMessage =
      error.response.data.message || "Oepsie Woepsie the Website is Gonzie!";

    if (statusCode === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        // Request new token
        const refreshToken = localStorage.getItem("refresh");
        const response = await axios.post(
          `${baseURL}api/v1/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        const newAccessToken = response.data.access;

        localStorage.setItem("access", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return axios(error.config);
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);
        localStorage.removeItem("access");
        localStorage.removeItem("refresh");
        // Clear storage and redirect to login~
        return Promise.reject(refreshError);
      }
    } else {
      console.error(errorMessage);

      return Promise.reject(error);
    }
  }
);

export default api;
