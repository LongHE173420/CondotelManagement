import React, { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

// --- Định nghĩa kiểu dữ liệu ---
interface Voucher {
  id: string;
  code: string;
  type: "Phần trăm" | "Số tiền cố định";
  value: number;
  condotelName: string; // "Tất cả" hoặc tên cụ thể
  usage: string; // "UsedCount/UsageLimit"
  dates: string; // "StartDate - EndDate"
  status: "Active" | "Expired" | "Inactive";
}

// --- Dữ liệu mẫu (Mock Data) ---
const mockVoucherData: Voucher[] = [
  {
    id: "1",
    code: "SALE30",
    type: "Phần trăm",
    value: 30,
    condotelName: "Tất cả Condotel",
    usage: "15/100",
    dates: "10/11/2025 - 20/11/2025",
    status: "Active",
  },
  {
    id: "2",
    code: "GIAM100K",
    type: "Số tiền cố định",
    value: 100000,
    condotelName: "Mường Thanh Vũng Tàu",
    usage: "50/50",
    dates: "01/11/2025 - 10/11/2025",
    status: "Expired",
  },
];

// --- Component Badge cho Trạng thái ---
const StatusBadge: React.FC<{ status: Voucher["status"] }> = ({ status }) => {
  let colorClasses = "";
  if (status === "Active") colorClasses = "bg-green-100 text-green-800";
  else if (status === "Expired") colorClasses = "bg-gray-100 text-gray-800";
  else colorClasses = "bg-yellow-100 text-yellow-800";
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colorClasses}`}>
      {status === "Active" ? "Hoạt động" : (status === "Expired" ? "Hết hạn" : "Ẩn")}
    </span>
  );
};

// --- Component Trang Danh sách Voucher ---
const PageVoucherList = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>(mockVoucherData);

  const handleDelete = (id: string, code: string) => {
    toast.info(`Xóa voucher "${code}"?`, {
      position: "bottom-center",
      autoClose: false,
      closeButton: true,
    });
    
    setVouchers(current => current.filter(v => v.id !== id));
    toast.success("✅ Đã xóa voucher thành công!");
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        
        {/* --- Header --- */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Quản lý Voucher
          </h1>
          <Link
            to="/manage-vouchers/add"
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            Tạo voucher mới
          </Link>
        </div>

        {/* --- Thanh Filter --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm theo mã voucher..."
            className="flex-1 md:max-w-lg px-4 py-2 border border-gray-300 rounded-md"
          />
          <select className="pl-4 pr-10 py-2 border border-gray-300 rounded-md bg-white w-full md:w-auto flex-shrink-0">
            <option value="">Lọc theo trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="expired">Hết hạn</option>
            <option value="inactive">Ẩn</option>
          </select>
        </div>

        {/* --- Bảng Dữ liệu --- */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Voucher</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Áp dụng cho</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sử dụng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hiệu lực</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vouchers.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{v.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                    {v.type === "Phần trăm" ? `${v.value}%` : `${v.value.toLocaleString("vi-VN")} VNĐ`}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{v.condotelName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{v.usage}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{v.dates}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={v.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/manage-vouchers/edit/${v.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(v.id, v.code)}
                      className="text-red-600 hover:text-red-800 ml-4"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PageVoucherList;