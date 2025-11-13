import axios from "axios";

const baseURL = process.env.REACT_APP_API_URL || "https://localhost:7216/api";

const axiosClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
});

// Request interceptor - Add token to headers
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    
    // Log request for debugging
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
axiosClient.interceptors.response.use(
  (response) => {
    console.log("✅ Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", error.response?.status, error.config?.url, error.response?.data);
    return Promise.reject(error);
  }
);

// ✅ Export mặc định (bắt buộc để file thành module)
export default axiosClient;
