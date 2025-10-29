import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { adminAPI, AdminUserDTO } from "api/admin";

type UserRole = "Chủ Condotel" | "Khách Hàng" | "Tenant" | "Owner" | "Admin";
type UserStatus = "Hoạt động" | "Không hoạt động" | "Active" | "Inactive";

interface UserAccount {
  id: string;
  userId: number;
  username?: string;
  fullName: string;
  email: string;
  role: UserRole;
  roleName: string;
  status: UserStatus;
  createdAt?: string;
  updatedAt?: string;
}


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
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminAPI.getAllUsers();
      console.log("Users data from API:", data);
      
      // Map API data to component format
      const mappedUsers: UserAccount[] = data.map((user) => ({
        id: user.userId.toString(),
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: mapRoleName(user.roleName),
        roleName: user.roleName,
        status: mapStatus(user.status),
        createdAt: user.createdAt ? formatDate(user.createdAt) : "",
        updatedAt: user.createdAt ? formatDate(user.createdAt) : "",
      }));
      
      setUsers(mappedUsers);
    } catch (err: any) {
      console.error("Failed to load users:", err);
      let errorMessage = "Không thể tải danh sách tài khoản";
      
      if (err.networkError || err.noResponse) {
        errorMessage = "Không thể kết nối đến server. Vui lòng kiểm tra lại kết nối mạng hoặc đảm bảo backend đang chạy.";
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.code === "ECONNREFUSED") {
        errorMessage = "Kết nối bị từ chối. Vui lòng kiểm tra xem backend server có đang chạy không.";
      } else if (err.code === "ERR_NETWORK") {
        errorMessage = "Lỗi mạng. Vui lòng kiểm tra kết nối internet.";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const mapRoleName = (roleName: string): UserRole => {
    if (roleName === "Owner" || roleName === "Chủ Condotel") return "Chủ Condotel";
    if (roleName === "Tenant" || roleName === "Khách Hàng") return "Khách Hàng";
    if (roleName === "Admin") return "Admin";
    return "Khách Hàng";
  };

  const mapStatus = (status: string): UserStatus => {
    if (status === "Active" || status === "Hoạt động") return "Hoạt động";
    return "Không hoạt động";
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch = 
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = !roleFilter || user.roleName === roleFilter;
    
    return matchesSearch && matchesRole;
  });



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

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
            {error}
            <button
              onClick={loadUsers}
              className="ml-4 text-red-600 underline hover:text-red-800"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* --- Thanh Filter và Tìm kiếm --- */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow px-4 py-2 border border-gray-300 rounded-md"
          />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-md bg-white"
          >
            <option value="">Tất cả vai trò</option>
            <option value="Admin">Admin</option>
            <option value="Owner">Chủ Condotel</option>
            <option value="Tenant">Khách Hàng</option>
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
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                      <span className="ml-2 text-gray-600">Đang tải...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    Không tìm thấy tài khoản nào
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {user.email.split("@")[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.createdAt || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                      {user.updatedAt || "N/A"}
                    </td>
                  </tr>
                ))
              )}
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