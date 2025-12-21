import React from "react";
import ReactDOM from "react-dom";

export interface ModalOptions {
  title?: string;
  message: string;
  type?: "success" | "error" | "info" | "warning";
  onClose?: () => void;
  autoClose?: boolean;
  autoCloseTime?: number;
}

const ModalNotification: React.FC<{
  title?: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  onClose: () => void;
}> = ({ title, message, type, onClose }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleClose = () => {
    setIsVisible(false);
    onClose();
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <svg
            className="w-6 h-6 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        );
      case "error":
        return (
          <svg
            className="w-6 h-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-6 h-6 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            className="w-6 h-6 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case "success":
        return "bg-green-50 border-green-200";
      case "error":
        return "bg-red-50 border-red-200";
      case "warning":
        return "bg-yellow-50 border-yellow-200";
      case "info":
      default:
        return "bg-blue-50 border-blue-200";
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case "success":
        return "bg-green-600 hover:bg-green-700 focus:ring-green-500";
      case "error":
        return "bg-red-600 hover:bg-red-700 focus:ring-red-500";
      case "warning":
        return "bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500";
      case "info":
      default:
        return "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500";
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className={`border-b ${getHeaderColor()} p-6 flex items-center gap-4`}>
            <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-white">
              {getIcon()}
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              {title || (type === "success" ? "Thành công" : type === "error" ? "Lỗi" : type === "warning" ? "Cảnh báo" : "Thông tin")}
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-neutral-600 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Footer */}
          <div className="bg-neutral-50 px-6 py-4 flex justify-end gap-3 border-t border-neutral-200">
            <button
              onClick={handleClose}
              className={`px-6 py-2 rounded-lg font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColor()}`}
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

let modalRoot: HTMLElement | null = null;

export const showModal = (options: ModalOptions): Promise<void> => {
  return new Promise((resolve) => {
    // Create root if not exists
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.id = "modal-root";
      document.body.appendChild(modalRoot);
    }

    const handleClose = () => {
      ReactDOM.unmountComponentAtNode(modalRoot!);
      options.onClose?.();
      resolve();
    };

    ReactDOM.render(
      <ModalNotification
        title={options.title}
        message={options.message}
        type={options.type || "info"}
        onClose={handleClose}
      />,
      modalRoot
    );

    // Auto close if enabled
    if (options.autoClose !== false) {
      setTimeout(handleClose, options.autoCloseTime || 3000);
    }
  });
};

// Shortcut functions
export const showSuccess = (message: string, title?: string) => {
  return showModal({ message, type: "success", title, autoClose: true });
};

export const showError = (message: string, title?: string) => {
  return showModal({ message, type: "error", title, autoClose: false });
};

export const showWarning = (message: string, title?: string) => {
  return showModal({ message, type: "warning", title, autoClose: true });
};

export const showInfo = (message: string, title?: string) => {
  return showModal({ message, type: "info", title, autoClose: true });
};
