import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminAPI } from "api/admin";

interface UserAccount {
  id: string;
  userId: number;
  fullName: string;
  email: string;
  role: string;         // Tên hiển thị: Admin, Chủ Condotel, Khách Hàng
  roleName: string;     // Tên từ backend: Admin, Host, Tenant
  status: string;
  createdAt?: string;
}

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusLower = status.toLowerCase();
  if (statusLower === "active" || statusLower === "hoạt động") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200">
        Hoạt động
      </span>
    );
  }
  if (statusLower === "pending") {
    return (
      <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200">
        Chờ xử lý
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200">
      Không hoạt động
    </span>
  );
};

const RoleBadge: React.FC<{ role: string }> = ({ role }) => {
  const roleConfig: Record<string, { name: string; bg: string; text: string }> = {
    "Admin": { name: "Admin", bg: "bg-gradient-to-r from-purple-100 to-pink-100", text: "text-purple-800" },
    "Chủ Condotel": { name: "Chủ Condotel", bg: "bg-gradient-to-r from-blue-100 to-cyan-100", text: "text-blue-800" },
    "Khách Hàng": { name: "Khách Hàng", bg: "bg-gradient-to-r from-green-100 to-emerald-100", text: "text-green-800" },
  };

  const config = roleConfig[role] || { name: role, bg: "bg-gradient-to-r from-gray-100 to-slate-100", text: "text-gray-800" };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-bold ${config.bg} ${config.text} border`}>
      {config.name}
    </span>
  );
};

const PageAccountList = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: (() => void) | null;
  }>({
    isOpen: false,
    title: "",
    message: "",
    action: null,
  });

  const itemsPerPage = 10;

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await adminAPI.getAllUsers();
      const mappedUsers: UserAccount[] = data.map((user: any) => ({
        id: user.userId.toString(),
        userId: user.userId,
        fullName: user.fullName,
        email: user.email,
        role: mapRoleToDisplay(user.roleName),
        roleName: user.roleName,
        status: mapStatus(user.status),
        createdAt: user.createdAt ? formatDate(user.createdAt) : "",
      }));
      setUsers(mappedUsers);
    } catch (err: any) {
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

  const mapRoleToDisplay = (roleNameFromBE: string): string => {
    switch (roleNameFromBE) {
      case "Admin":
        return "Admin";
      case "Host":
        return "Chủ Condotel";
      case "Tenant":
        return "Khách Hàng";
      default:
        return "Khách Hàng";
    }
  };

  const mapStatus = (status: string): string => status;

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  // Dùng tên hiển thị để filter và hiển thị đẹp hơn
  const uniqueDisplayRoles = Array.from(new Set(users.map(u => u.role))).sort();

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !roleFilter || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, roleFilter]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleEdit = (userId: number) => {
    navigate(`/account-detail/${userId}`);
  };

  const handleToggleStatus = async (userId: number, currentStatus: string, fullName: string) => {
    const newStatus = currentStatus === "Hoạt động" || currentStatus === "Active"
      ? "Inactive"
      : "Active";

    setConfirmModal({
      isOpen: true,
      title: newStatus === "Active" ? "Kích hoạt tài khoản" : "Vô hiệu hóa tài khoản",
      message: `Bạn có chắc chắn muốn ${newStatus === "Active" ? "kích hoạt" : "vô hiệu hóa"} tài khoản "${fullName}"?`,
      action: async () => {
        setUpdatingStatusId(userId);
        setError("");
        try {
          await adminAPI.updateUserStatus(userId, newStatus);
          await loadUsers();
          alert(`Cập nhật trạng thái thành công! Tài khoản đã được ${newStatus === "Active" ? "kích hoạt" : "vô hiệu hóa"}.`);
        } catch (err: any) {
          let errorMessage = "Không thể cập nhật trạng thái";
          if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          alert(errorMessage);
        } finally {
          setUpdatingStatusId(null);
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        }
      },
    });
  };

  const handleDelete = async (userId: number, fullName: string) => {
    setConfirmModal({
      isOpen: true,
      title: "Xóa tài khoản",
      message: `Bạn có chắc chắn muốn xóa tài khoản "${fullName}"? Hành động này không thể hoàn tác.`,
      action: async () => {
        setDeletingId(userId);
        setError("");
        try {
          await adminAPI.deleteUser(userId);
          await loadUsers();
          alert("Xóa tài khoản thành công!");
        } catch (err: any) {
          let errorMessage = "Không thể xóa tài khoản";
          if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
          } else if (err.message) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          alert(errorMessage);
        } finally {
          setDeletingId(null);
          setConfirmModal({ isOpen: false, title: "", message: "", action: null });
        }
      },
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-slate-200 dark:border-slate-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-slate-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-slate-50 to-gray-50 dark:from-slate-900/20 dark:to-gray-900/20 rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-gray-600 bg-clip-text text-transparent mb-2">
            Quản lý Tài khoản
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Quản lý tất cả tài khoản người dùng trong hệ thống
          </p>
        </div>
        <Link
          to="/add-account"
          className="px-6 py-3 bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 text-white rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Thêm tài khoản
        </Link>
      </div>

      {error && (
        <div className="p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              onClick={loadUsers}
              className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}

      {/* Filter Section */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-200/50 dark:border-slate-800/50">
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            placeholder="Tìm kiếm tài khoản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-500 dark:bg-neutral-700 dark:text-neutral-100"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl bg-white dark:bg-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-slate-500"
          >
            <option value="">Tất cả vai trò ({users.length})</option>
            {uniqueDisplayRoles.map((role) => {
              const count = users.filter(u => u.role === role).length;
              return (
                <option key={role} value={role}>
                  {role} ({count})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-slate-200/50 dark:border-slate-800/50">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
            <thead className="bg-gradient-to-r from-slate-50 to-gray-50 dark:from-neutral-700 dark:to-neutral-800">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Tên đăng nhập</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Người dùng</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Vai trò</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Trạng thái</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Ngày tạo</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-400 to-gray-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Không tìm thấy tài khoản nào</p>
                      <p className="text-neutral-600 dark:text-neutral-400">Hãy thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gradient-to-r hover:from-slate-50/50 hover:to-gray-50/50 dark:hover:from-neutral-700/50 dark:hover:to-neutral-800/50 transition-all duration-200">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {user.email.split("@")[0]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-neutral-900 dark:text-neutral-100">{user.fullName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={user.status} />
                        <button
                          onClick={() => handleToggleStatus(user.userId, user.status, user.fullName)}
                          disabled={updatingStatusId === user.userId || user.status.toLowerCase() === "pending"}
                          className={`px-3 py-1 text-xs font-bold rounded-lg transition-all duration-300 ${user.status.toLowerCase() === "active" || user.status === "Hoạt động"
                            ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white hover:from-yellow-600 hover:to-amber-600 shadow-md hover:shadow-lg"
                            : user.status.toLowerCase() === "pending"
                              ? "bg-gray-100 text-gray-500 cursor-not-allowed"
                              : "bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600 shadow-md hover:shadow-lg"
                            } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={
                            user.status.toLowerCase() === "pending"
                              ? "Không thể thay đổi trạng thái Pending"
                              : user.status.toLowerCase() === "active" || user.status === "Hoạt động"
                                ? "Vô hiệu hóa"
                                : "Kích hoạt"
                          }
                        >
                          {updatingStatusId === user.userId
                            ? "..."
                            : user.status.toLowerCase() === "pending"
                              ? "Pending"
                              : user.status.toLowerCase() === "active" || user.status === "Hoạt động"
                                ? "Vô hiệu hóa"
                                : "Kích hoạt"}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {user.createdAt || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => handleEdit(user.userId)}
                          className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(user.userId, user.fullName)}
                          disabled={deletingId === user.userId}
                          className="px-4 py-2 text-sm font-bold bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === user.userId ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Đang xóa...
                            </span>
                          ) : "Xóa"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination - ĐẦY ĐỦ NHƯ FILE CŨ */}
      {filteredUsers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-slate-200/50 dark:border-slate-800/50">
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-4 sm:mb-0">
            Hiển thị {startIndex + 1} - {Math.min(endIndex, filteredUsers.length)} trong tổng số {filteredUsers.length} tài khoản
          </div>
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${currentPage === 1
                ? "text-gray-400 cursor-not-allowed bg-gray-100"
                : "text-white bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 shadow-md hover:shadow-lg"
                }`}
            >
              Trang đầu
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${currentPage === 1
                ? "text-gray-400 cursor-not-allowed bg-gray-100"
                : "text-white bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 shadow-md hover:shadow-lg"
                }`}
            >
              Trước
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              if (
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)
              ) {
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${currentPage === page
                      ? "text-white bg-gradient-to-r from-slate-600 to-gray-600 shadow-lg scale-105"
                      : "text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-600 shadow-md hover:shadow-lg"
                      }`}
                  >
                    {page}
                  </button>
                );
              } else if (page === currentPage - 2 || page === currentPage + 2) {
                return <span key={page} className="px-2 text-gray-400">...</span>;
              }
              return null;
            })}

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed bg-gray-100"
                : "text-white bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 shadow-md hover:shadow-lg"
                }`}
            >
              Sau
            </button>
            <button
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed bg-gray-100"
                : "text-white bg-gradient-to-r from-slate-500 to-gray-500 hover:from-slate-600 hover:to-gray-600 shadow-md hover:shadow-lg"
                }`}
            >
              Trang cuối
            </button>
          </nav>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg shadow-2xl p-6 max-w-sm w-11/12">
            <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100 mb-2">
              {confirmModal.title}
            </h3>
            <p className="text-neutral-600 dark:text-neutral-400 mb-6">
              {confirmModal.message}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ isOpen: false, title: "", message: "", action: null })}
                className="px-4 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-100 font-medium hover:bg-neutral-300 dark:hover:bg-neutral-600 transition"
              >
                Hủy
              </button>
              <button
                onClick={() => confirmModal.action?.()}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
              >
                Đồng ý
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PageAccountList;