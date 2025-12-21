import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// Component con Sidebar
const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-5 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold border-b border-gray-200 pb-3 mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const PageLocationAdd = () => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("Vui lòng nhập Tên địa điểm.");
      return;
    }
    setIsLoading(true);
    // TODO: Gọi API
    setTimeout(() => {
      setIsLoading(false);
      alert("Tạo địa điểm thành công!");
      navigate("/manage-locations");
    }, 1000);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <Link to="/manage-locations" className="text-sm text-blue-600 hover:underline">
            &larr; Quay lại danh sách
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* --- CỘT TRÁI (NỘI DUNG CHÍNH) --- */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Tên địa điểm (Name)
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả (Description)
                </label>
                <textarea
                  id="description"
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md resize-y"
                ></textarea>
              </div>
            </div>
          </div>

          {/* --- CỘT PHẢI (SIDEBAR) --- */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            <SidebarCard title="Hành động">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400"
              >
                {isLoading ? "Đang lưu..." : "Lưu địa điểm"}
              </button>
            </SidebarCard>
          </div>
        </div>
      </form>
    </div>
  );
};

export default PageLocationAdd;