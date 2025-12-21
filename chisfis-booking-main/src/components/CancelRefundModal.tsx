import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";

interface RefundInfo {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

interface CancelRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (info: RefundInfo) => void;
  refundAmount: number;
}

const CancelRefundModal: React.FC<CancelRefundModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  refundAmount,
}) => {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountHolder, setAccountHolder] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankName || !accountNumber || !accountHolder) {
      toast.error("❌ Vui lòng điền đầy đủ thông tin ngân hàng để nhận tiền hoàn.");
      return;
    }
    onConfirm({ bankName, accountNumber, accountHolder });
  };

  const formattedAmount = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(refundAmount);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900">Yêu cầu Hủy & Hoàn tiền</h3>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Thông báo số tiền */}
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
            <p className="text-sm text-blue-700">
              Theo chính sách, bạn sẽ được hoàn lại:
            </p>
            <p className="text-2xl font-bold text-blue-800 mt-1">{formattedAmount}</p>
          </div>

          <p className="text-sm text-gray-600">
            Vui lòng cung cấp thông tin tài khoản ngân hàng để Admin chuyển khoản hoàn tiền cho bạn.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên Ngân hàng</label>
            <input
              type="text"
              placeholder="VD: Vietcombank, MBBank..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Số tài khoản</label>
            <input
              type="text"
              placeholder="Nhập số tài khoản..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ tài khoản</label>
            <input
              type="text"
              placeholder="VIET HOA KHONG DAU"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value.toUpperCase())}
              required
            />
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Đóng
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
            >
              Xác nhận Hủy phòng
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CancelRefundModal;