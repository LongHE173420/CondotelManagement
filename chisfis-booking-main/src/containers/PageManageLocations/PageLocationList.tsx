import React, { useState } from "react";
import { Link } from "react-router-dom";
import ConfirmModal from "components/ConfirmModal";

// --- Định nghĩa kiểu dữ liệu ---
interface Location {
  id: string;
  name: string;
  description: string;
}

// --- Dữ liệu mẫu (Mock Data) ---
const mockLocationData: Location[] = [
  {
    id: "1",
    name: "Vũng Tàu",
    description: "Một thành phố biển nổi tiếng gần TP.HCM.",
  },
  {
    id: "2",
    name: "Nha Trang",
    description: "Nổi tiếng với các vịnh, bãi biển đẹp và đảo.",
  },
  {
    id: "3",
    name: "Đà Nẵng",
    description: "Thành phố đáng sống với Cầu Rồng và bãi biển Mỹ Khê.",
  },
];

// --- Component Trang Danh sách Địa điểm ---
const PageLocationList = () => {
  const [locations, setLocations] = useState<Location[]>(mockLocationData);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState<string | null>(null);
  const [deletingLocationName, setDeletingLocationName] = useState<string>("");

  const handleDelete = (id: string, name: string) => {
    setDeletingLocationId(id);
    setDeletingLocationName(name);
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    if (!deletingLocationId) return;
    setShowConfirmModal(false);
    // TODO: Gọi API xóa
    setLocations(current => current.filter(loc => loc.id !== deletingLocationId));
    setDeletingLocationId(null);
    setDeletingLocationName("");
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">
        
        {/* --- Header --- */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Quản lý Địa điểm
          </h1>
          <Link
            to="/manage-locations/add"
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            Thêm địa điểm mới
          </Link>
        </div>

        {/* --- Thanh Filter --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên địa điểm..."
            className="w-full md:flex-1 md:max-w-lg px-4 py-2 border border-gray-300 rounded-md"
          />
        </div>

        {/* --- Bảng Dữ liệu --- */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Địa điểm (Name)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mô tả (Description)</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {locations.map((loc) => (
                <tr key={loc.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{loc.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      to={`/manage-locations/edit/${loc.id}`}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Sửa
                    </Link>
                    <button
                      onClick={() => handleDelete(loc.id, loc.name)}
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

export default PageLocationList;