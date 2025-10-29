// ✅ Import để TS nhận biết đây là module
import axios from "axios";

// Fallback URL nếu .env không có
// Sử dụng http thay vì https cho localhost (https cần certificate)
const baseURL = process.env.REACT_APP_API_URL || "http://localhost:7216/api";

console.log("🔧 API Base URL:", baseURL);
if (!process.env.REACT_APP_API_URL) {
  console.warn("⚠️ REACT_APP_API_URL không được set, đang dùng default:", baseURL);
  console.warn("💡 Tạo file .env với REACT_APP_API_URL=http://localhost:7216/api");
}

const axiosClient = axios.create({
  baseURL: baseURL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // 10 seconds
});

// Request interceptor - Add token to headers
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    
    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }
    
    // Log request for debugging
    console.log("📤 Request:", config.method?.toUpperCase(), config.url);
    if (config.data instanceof FormData) {
      console.log("📤 Uploading file:", (config.data as FormData).get("file"));
    }
    
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
    // Enhanced error logging
    if (error.response) {
      // Server responded with error status
      console.error("❌ API Error Response:", {
        status: error.response.status,
        statusText: error.response.statusText,
        url: error.config?.url,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      // Request made but no response received
      console.error("❌ API Network Error (No Response):", {
        url: error.config?.url,
        method: error.config?.method,
        message: error.message,
        code: error.code,
      });
      
      // Set a more helpful error message
      error.noResponse = true;
      error.networkError = true;
    } else {
      // Error setting up request
      console.error("❌ API Request Setup Error:", {
        message: error.message,
        url: error.config?.url,
      });
    }
    
    return Promise.reject(error);
  }
);

// ✅ Export mặc định (bắt buộc để file thành module)
export default axiosClient;

// ✅ Dòng này là CHÌA KHÓA — buộc TS nhận file là module dù chưa detect import/export
export {};
