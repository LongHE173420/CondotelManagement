import { toast } from "react-toastify";

/**
 * Toast notification helper functions
 * Provides consistent, professional toast notifications throughout the application
 */

export const toastSuccess = (message: string, options?: any) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

export const toastError = (message: string, options?: any) => {
  toast.error(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

export const toastWarning = (message: string, options?: any) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 3500,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

export const toastInfo = (message: string, options?: any) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options,
  });
};

// Convenience function for common success messages
export const showSuccessMessage = (action: string, entity: string = "") => {
  const message = entity 
    ? `${action} ${entity} thành công!`
    : `${action} thành công!`;
  toastSuccess(message);
};

// Convenience function for common error messages
export const showErrorMessage = (action: string, error?: any) => {
  let message = `${action} thất bại.`;
  
  if (error?.response?.data?.message) {
    message = error.response.data.message;
  } else if (error?.message) {
    message = error.message;
  }
  
  // Translate common English error messages to Vietnamese
  message = translateErrorMessage(message);
  
  toastError(message);
};

// Translate common English error messages to Vietnamese
const translateErrorMessage = (message: string): string => {
  const translations: Record<string, string> = {
    // Booking cancellation errors
    "Cannot cancel this booking. It may not be eligible for refund (e.g., too close to check-in date, already paid to host, or outside refund window).": 
      "Không thể hủy booking",
    "Cannot cancel this booking": 
      "Không thể hủy booking",
    "may not be eligible for refund": 
      "Không thể hủy booking",
    "too close to check-in date": 
      "Không thể hủy booking",
    "already paid to host": 
      "Không thể hủy booking",
    "outside refund window": 
      "Không thể hủy booking",
  };
  
  // Check for exact match first
  if (translations[message]) {
    return translations[message];
  }
  
  // Check for partial matches (case-insensitive)
  const lowerMessage = message.toLowerCase();
  for (const [english, vietnamese] of Object.entries(translations)) {
    if (lowerMessage.includes(english.toLowerCase())) {
      return vietnamese;
    }
  }
  
  return message;
};

// Convenience function for validation errors
export const showValidationError = (message: string) => {
  toastWarning(message, { autoClose: 3000 });
};

