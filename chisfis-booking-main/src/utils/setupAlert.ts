import { showModal, showSuccess, showError, showWarning, showInfo } from "utils/modalNotification";

/**
 * Thay thế window.alert() bằng custom modal đẹp hơn
 * Tự động phát hiện loại thông báo dựa trên nội dung
 */
export const setupCustomAlert = () => {
  // Save original alert
  const originalAlert = window.alert;

  // Override alert with custom modal
  window.alert = (message: string) => {
    // Detect message type
    const lowerMessage = message.toLowerCase();
    
    if (
      lowerMessage.includes("thành công") ||
      lowerMessage.includes("success") ||
      lowerMessage.includes("đã") ||
      lowerMessage.includes("hoàn tất")
    ) {
      showSuccess(message);
    } else if (
      lowerMessage.includes("lỗi") ||
      lowerMessage.includes("error") ||
      lowerMessage.includes("không thể") ||
      lowerMessage.includes("thất bại")
    ) {
      showError(message);
    } else if (
      lowerMessage.includes("cảnh báo") ||
      lowerMessage.includes("warning") ||
      lowerMessage.includes("vui lòng")
    ) {
      showWarning(message);
    } else {
      showInfo(message);
    }
  };

  return () => {
    // Restore original alert if needed
    window.alert = originalAlert;
  };
};
