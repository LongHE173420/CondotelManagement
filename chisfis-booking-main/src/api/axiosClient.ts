import axios from "axios";
import logger from "utils/logger";

// Enforce HTTPS in production, validate API URL
const baseURL = (() => {
  const url = process.env.REACT_APP_API_URL;
  
  if (!url) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('REACT_APP_API_URL environment variable must be set in production');
    }
    // Development: allow localhost with https
    return "https://localhost:7216/api";
  }
  
  // Validate HTTPS in production
  if (process.env.NODE_ENV === 'production' && !url.startsWith('https://')) {
    throw new Error('API URL must use HTTPS in production. Current: ' + url);
  }
  
  return url;
})();

if (process.env.NODE_ENV === 'development') {
  logger.info("API Base URL (dev):", baseURL);
}

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
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData, let browser set it with boundary
    if (config.data instanceof FormData && config.headers) {
      delete config.headers["Content-Type"];
    }

    // Log API requests only in development
    if (process.env.NODE_ENV === 'development') {
      logger.apiRequest(config.method?.toUpperCase() || "GET", config.url || "", config.data);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
axiosClient.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === 'development') {
      logger.apiResponse(response.status, response.config.url || "", response.data);
    }
    return response;
  },
  (error) => {
    // Enhanced error logging
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const url = error.config?.url;
      const data = error.response.data; // Capture data here for reuse

      logger.apiError(status, url || "", error);

      // 🚨 BƯỚC DEBUG QUAN TRỌNG NHẤT: In chi tiết lỗi Validation (400 Bad Request)
      if (status === 400) {
        if (data?.errors) {
          logger.group("Validation Errors (400)", () => {
            logger.error("Validation errors:", data.errors);
            // Format validation errors for easier reading
            if (typeof data.errors === 'object') {
              const errorMessages = Object.entries(data.errors)
                .map(([key, value]: [string, any]) => {
                  if (Array.isArray(value)) {
                    return `${key}: ${value.join(', ')}`;
                  }
                  return `${key}: ${value}`;
                })
                .join('\n');
              logger.error("Formatted errors:\n", errorMessages);
            }
          });
        }
        if (data?.message) {
          logger.error("Error Message:", data.message);
        }
        if (data?.title) {
          logger.error("Error Title:", data.title);
        }
      }

      // Handle 401 Unauthorized - token expired or invalid
      if (status === 401) {
        logger.error("Unauthorized (401) - Token may be expired or invalid", {
          url,
          hasToken: !!localStorage.getItem("token"),
        });

        // Only logout if not already on login page to avoid redirect loops
        if (!window.location.pathname.includes("/login") && !window.location.pathname.includes("/register")) {
          logger.warn("Redirecting to login due to 401 error");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          // Use setTimeout to avoid navigation during render
          setTimeout(() => {
            window.location.href = "/login";
          }, 100);
        }
      }
    } else if (error.request) {
      // Request made but no response received
      logger.error("API Network Error (No Response):", {
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
      logger.error("API Request Setup Error:", {
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
export { };
