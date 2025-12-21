import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import customerAPI, { CustomerDTO } from "api/customer";
import bookingAPI from "api/booking";

const HostCustomerContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<CustomerDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDTO | null>(null);
  const [customerBookings, setCustomerBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  useEffect(() => {
    // Check if user is Host
    if (!isAuthenticated || user?.roleName !== "Host") {
      navigate("/");
      return;
    }
    loadData();
  }, [isAuthenticated, user, navigate]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (selectedCustomer) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedCustomer]);

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const customersData = await customerAPI.getCustomers();
      setCustomers(customersData);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách khách hàng");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCustomerBookings = async (userId: number) => {
    setLoadingBookings(true);
    try {
      const bookings = await bookingAPI.getHostBookingsByCustomer(userId);
      setCustomerBookings(bookings);
    } catch (err: any) {
      setCustomerBookings([]);
    } finally {
      setLoadingBookings(false);
    }
  };

  const handleViewCustomer = (customer: CustomerDTO) => {
    setSelectedCustomer(customer);
    if (customer.userId) {
      loadCustomerBookings(customer.userId);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString + (dateString.includes("T") ? "" : "T00:00:00")).toLocaleDateString("vi-VN");
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (!amount) return "0 đ";
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  const mapStatusToVN = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Đang xử lý";
      case "cancelled":
        return "Đã hủy";
      case "completed":
        return "Hoàn thành";
      default:
        return status || "Đang xử lý";
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase()) {
      case "confirmed":
      case "completed":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "pending":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400";
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-teal-200 dark:border-teal-800"></div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-teal-600 absolute top-0 left-0"></div>
        </div>
        <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-l-4 border-red-500 text-red-800 dark:text-red-200 rounded-xl shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8 bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-2xl p-6 border border-teal-200/50 dark:border-teal-800/50">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent mb-2">
            Danh sách khách hàng
          </h2>
          <p className="text-neutral-600 dark:text-neutral-400">
            Khách hàng đã đặt phòng tại các căn hộ của bạn
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-16 bg-gradient-to-br from-white to-teal-50/30 dark:from-neutral-800 dark:to-teal-900/10 rounded-2xl shadow-xl border border-teal-200/50 dark:border-teal-800/50">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
            Chưa có khách hàng nào
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400">
            Khách hàng sẽ xuất hiện ở đây sau khi họ đặt phòng.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <div
              key={customer.userId}
              className="bg-gradient-to-br from-white to-teal-50/30 dark:from-neutral-800 dark:to-teal-900/10 rounded-2xl shadow-xl p-6 border border-teal-200/50 dark:border-teal-800/50 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
              onClick={() => handleViewCustomer(customer)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
                      {customer.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-neutral-900 dark:text-neutral-100">
                        {customer.fullName}
                      </h3>
                    </div>
                  </div>
                  {customer.email && (
                    <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400 mb-1">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {customer.email}
                    </div>
                  )}
                  {customer.phone && (
                    <div className="flex items-center text-sm text-neutral-500 dark:text-neutral-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {customer.phone}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {customer.gender && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Giới tính:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {customer.gender}
                    </span>
                  </div>
                )}
                {customer.dateOfBirth && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Ngày sinh:</span>
                    <span className="text-neutral-900 dark:text-neutral-100">
                      {formatDate(customer.dateOfBirth)}
                    </span>
                  </div>
                )}
                {customer.address && (
                  <div className="flex items-start justify-between text-sm">
                    <span className="text-neutral-500 dark:text-neutral-400">Địa chỉ:</span>
                    <span className="text-neutral-900 dark:text-neutral-100 text-right ml-2">
                      {customer.address}
                    </span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-teal-200 dark:border-teal-800">
                <button className="w-full text-center text-sm font-bold bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white py-2 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center gap-2">
                  <span>Xem chi tiết</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ position: 'fixed', width: '100%', height: '100%' }}>
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div
              className="fixed inset-0 transition-opacity bg-gray-900 bg-opacity-50 backdrop-blur-sm"
              onClick={() => setSelectedCustomer(null)}
            ></div>

            <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl transform transition-all w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700 px-6 py-4 flex items-center justify-between z-10">
                <h3 className="text-xl font-bold bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent">
                  Chi tiết khách hàng: {selectedCustomer.fullName}
                </h3>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors p-2 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded-lg"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="px-6 py-6">

                <div className="mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Email</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {selectedCustomer.email || "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400">Số điện thoại</p>
                      <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                        {selectedCustomer.phone || "N/A"}
                      </p>
                    </div>
                    {selectedCustomer.gender && (
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Giới tính</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {selectedCustomer.gender}
                        </p>
                      </div>
                    )}
                    {selectedCustomer.dateOfBirth && (
                      <div>
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Ngày sinh</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {formatDate(selectedCustomer.dateOfBirth)}
                        </p>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="col-span-2">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">Địa chỉ</p>
                        <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                          {selectedCustomer.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-semibold text-neutral-900 dark:text-neutral-100 mb-3">
                    Lịch sử đặt phòng
                  </h4>
                  {loadingBookings ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : customerBookings.length === 0 ? (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                      Chưa có đặt phòng nào
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                        <thead className="bg-neutral-50 dark:bg-neutral-700">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                              Mã đặt phòng
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                              Căn hộ
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                              Check-in / Check-out
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                              Tổng tiền
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                              Trạng thái
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                              Ngày đặt
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                          {customerBookings.map((booking) => (
                            <tr key={booking.bookingId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                #{booking.bookingId}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                                {booking.condotelName || `Condotel #${booking.condotelId}`}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-900 dark:text-neutral-100">
                                <div>{formatDate(booking.startDate)}</div>
                                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                                  → {formatDate(booking.endDate)}
                                </div>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                {formatCurrency(booking.totalPrice)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(
                                    booking.status
                                  )}`}
                                >
                                  {mapStatusToVN(booking.status)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                                {formatDate(booking.bookingDate || booking.createdAt)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HostCustomerContent;






