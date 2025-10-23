// ✅ Import để TS nhận biết đây là module
import axios from "axios";

const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Export mặc định (bắt buộc để file thành module)
export default axiosClient;

// ✅ Dòng này là CHÌA KHÓA — buộc TS nhận file là module dù chưa detect import/export
export {};
