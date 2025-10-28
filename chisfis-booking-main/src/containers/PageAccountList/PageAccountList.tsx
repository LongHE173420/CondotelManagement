import React, { useState } from "react";
import { Link } from "react-router-dom";


type UserRole = "Chủ Condotel" | "Khách Hàng";
type UserStatus = "Hoạt động" | "Không hoạt động";

interface UserAccount {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
}


const mockUserData: UserAccount[] = [
  {
    id: "1",
    username: "an.nguyen",
    fullName: "Nguyễn Văn An",
    email: "An@gmail.com",
    role: "Chủ Condotel",
    status: "Hoạt động",
    createdAt: "10/10/2025",
    updatedAt: "12/10/2025",
  },
  {
    id: "2",
    username: "binh.tran",
    fullName: "Trần Thị Bình",
    email: "Binh@gmail.com",
    role: "Khách Hàng",
    status: "Không hoạt động",
    createdAt: "05/09/2025",
    updatedAt: "05/09/2025",
  },
  {
    id: "3",
    username: "cuong.le",
    fullName: "Lê Văn Cường",
    email: "Cuong@gmail.com",
    role: "Chủ Condotel",
    status: "Hoạt động",
    createdAt: "01/08/2025",
    updatedAt: "09/10/2025",
  },
];


const StatusBadge: React.FC<{ status: UserStatus }> = ({ status }) => {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  if (status === "Hoạt động") {
    return (
      <span className={`${baseClasses} bg-green-100 text-green-800`}>
        Hoạt động
      </span>
    );
  }
  return (
    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
      Không hoạt động
    </span>
  );
};


const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
  if (role === "Chủ Condotel") {
    return (
      <span className={`${baseClasses} bg-blue-100 text-blue-800`}>
        Chủ Condotel
      </span>
    );
  }
  return (
    <span className={`${baseClasses} bg-gray-100 text-gray-800`}>
      Khách Hàng
    </span>
  );
};

const PageAccountList = () => {
  const [users, setUsers] = useState<UserAccount[]>(mockUserData);
  const [currentPage, setCurrentPage] = useState(1);



  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto bg-white p-6 rounded-lg shadow-md">

        {/* --- Header: Tiêu đề và Nút Thêm --- */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Danh sách tài khoản
          </h1>
          <Link
            to="/add-account"
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-700"
          >
            Thêm tài khoản
          </Link>
        </div>

        {/* --- Thanh Filter và Tìm kiếm --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản"
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md"
          />
          <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">
            Tìm kiếm
          </button>
          <select className="px-4 py-2 border border-gray-300 rounded-md bg-white">
            <option value="">Lọc theo vai trò</option>
            <option value="admin">Chủ Condotel</option>
            <option value="user">Khách Hàng</option>
          </select>
        </div>

        {/* --- Bảng Dữ liệu --- */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên đăng nhập</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày cập nhật</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.fullName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge status={user.status} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.createdAt}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.updatedAt}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* --- Phân trang (Pagination) --- */}
        <div className="flex justify-center items-center mt-6">
          <nav className="flex items-center space-x-2">
            <button className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100">
              Trang đầu
            </button>
            <button className="px-4 py-2 text-sm text-white bg-gray-600 rounded-md">
              1
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100">
              2
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100">
              3
            </button>
            <button className="px-4 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100">
              Trang cuối
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default PageAccountList;