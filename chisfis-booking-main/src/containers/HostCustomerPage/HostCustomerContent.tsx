import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import customerAPI, { CustomerDTO, CustomerBookingDTO } from "api/customer";
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

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const customersData = await customerAPI.getCustomers();
      setCustomers(customersData);
    } catch (err: any) {
      console.error("Failed to load customers:", err);
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
      console.error("Failed to load customer bookings:", err);
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
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
        {error}
        <button
          onClick={loadData}
          className="ml-4 text-red-600 underline hover:text-red-800"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Danh sách khách hàng</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Khách hàng đã đặt phòng tại các căn hộ của bạn
          </p>
        </div>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-neutral-800 rounded-xl shadow-lg">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Chưa có khách hàng nào
          </h3>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            Khách hàng sẽ xuất hiện ở đây sau khi họ đặt phòng.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {customers.map((customer) => (
            <div
              key={customer.userId}
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow cursor-pointer"
              onClick={() => handleViewCustomer(customer)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    {customer.fullName}
                  </h3>
                  {customer.email && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
                      {customer.email}
                    </p>
                  )}
                  {customer.phone && (
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      {customer.phone}
                    </p>
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

              <div className="pt-4 border-t border-neutral-200 dark:border-neutral-700">
                <button className="w-full text-center text-sm font-medium text-primary-600 hover:text-primary-700">
                  Xem chi tiết →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setSelectedCustomer(null)}
            ></div>

            <div className="inline-block align-bottom bg-white dark:bg-neutral-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                    Chi tiết khách hàng: {selectedCustomer.fullName}
                  </h3>
                  <button
                    onClick={() => setSelectedCustomer(null)}
                    className="text-neutral-400 hover:text-neutral-500"
                  >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

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
                                {formatDate(booking.createdAt)}
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






