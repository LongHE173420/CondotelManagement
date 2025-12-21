import React from "react";
import ReactDOM from "react-dom";

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "info" | "warning";
}

const ConfirmDialog: React.FC<{
  title?: string;
  message: string;
  confirmText: string;
  cancelText: string;
  type: "danger" | "info" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}> = ({ title, message, confirmText, cancelText, type, onConfirm, onCancel }) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleConfirm = () => {
    setIsVisible(false);
    onConfirm();
  };

  const handleCancel = () => {
    setIsVisible(false);
    onCancel();
  };

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case "danger":
        return (
          <svg
            className="w-12 h-12 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 9v2m0 4v2m-6-4a9 9 0 1118 0 9 9 0 01-18 0z"
            />
          </svg>
        );
      case "warning":
        return (
          <svg
            className="w-12 h-12 text-yellow-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "info":
      default:
        return (
          <svg
            className="w-12 h-12 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
    }
  };

  const getHeaderColor = () => {
    switch (type) {
      case "danger":
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
      case "danger":
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
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          {/* Header */}
          <div className={`border-b ${getHeaderColor()} p-6 flex items-center gap-4`}>
            <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-white">
              {getIcon()}
            </div>
            <h2 className="text-lg font-bold text-neutral-900">
              {title || "Xác nhận"}
            </h2>
          </div>

          {/* Content */}
          <div className="p-6">
            <p className="text-neutral-600 text-sm leading-relaxed">{message}</p>
          </div>

          {/* Footer */}
          <div className="bg-neutral-50 px-6 py-4 flex justify-end gap-3 border-t border-neutral-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg font-medium text-neutral-700 bg-neutral-200 hover:bg-neutral-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-neutral-500"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`px-4 py-2 rounded-lg font-medium text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${getButtonColor()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

let confirmRoot: HTMLElement | null = null;

export const showConfirm = (options: ConfirmOptions): Promise<boolean> => {
  return new Promise((resolve) => {
    // Create root if not exists
    if (!confirmRoot) {
      confirmRoot = document.createElement("div");
      confirmRoot.id = "confirm-root";
      document.body.appendChild(confirmRoot);
    }

    const handleConfirm = () => {
      ReactDOM.unmountComponentAtNode(confirmRoot!);
      resolve(true);
    };

    const handleCancel = () => {
      ReactDOM.unmountComponentAtNode(confirmRoot!);
      resolve(false);
    };

    ReactDOM.render(
      <ConfirmDialog
        title={options.title}
        message={options.message}
        confirmText={options.confirmText || "Xác nhận"}
        cancelText={options.cancelText || "Hủy"}
        type={options.type || "info"}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />,
      confirmRoot
    );
  });
};

// Shortcut function
export const confirm = async (message: string, title?: string): Promise<boolean> => {
  return showConfirm({
    title: title || "Xác nhận",
    message,
    confirmText: "Đồng ý",
    cancelText: "Hủy",
    type: "warning",
  });
};
