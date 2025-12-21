import React from "react";
import ReactDOM from "react-dom/client";
//
import "react-dates/initialize";
import "react-dates/lib/css/_datepicker.css";
import "rc-slider/assets/index.css";
// STYLE
import "./styles/index.scss";
import "./index.css";
import "./fonts/line-awesome-1.3.0/css/line-awesome.css";

//
import App from "./App";
import reportWebVitals from "./reportWebVitals";

// --- BẮT ĐẦU SỬA LỖI DỊCH LỊCH ---
import moment from "moment"; // <-- THÊM DÒNG NÀY
import "moment/locale/vi";  // <-- THÊM DÒNG NÀY
moment.locale("vi");       // <-- THÊM DÒNG NÀY
// --- KẾT THÚC SỬA LỖI DỊCH LỊCH ---

// Suppress React warnings about deprecated lifecycle methods in third-party libraries
const originalError = console.error;
console.error = (...args: any[]) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('componentWillReceiveProps')
  ) {
    return;
  }
  originalError.apply(console, args);
};

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);

root.render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();