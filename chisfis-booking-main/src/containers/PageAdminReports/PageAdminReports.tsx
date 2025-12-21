import React, { useState, useEffect } from "react";
import { adminAPI, AdminReportCreateDTO, AdminReportListDTO, AdminReportResponseDTO, HostListItemDTO } from "api/admin";
import { toastSuccess, toastError } from "utils/toast";
import { useAuth } from "contexts/AuthContext";
import ConfirmModal from "components/ConfirmModal";

interface HostOption {
  hostId: number;
  fullName: string;
  email: string;
}

const PageAdminReports: React.FC = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState<AdminReportListDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [hosts, setHosts] = useState<HostOption[]>([]);
  const [loadingHosts, setLoadingHosts] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<AdminReportCreateDTO>({
    reportType: "HostReport",
    hostId: undefined,
    fromDate: undefined,
    toDate: undefined,
    year: new Date().getFullYear(),
    month: null,
  });

  useEffect(() => {
    loadReports();
    loadHosts();
  }, []);

  const loadHosts = async () => {
    setLoadingHosts(true);
    try {
      // Sử dụng API mới: GET /api/admin/reports/hosts để lấy danh sách hosts với hostId thực sự
      const hostsData = await adminAPI.getHostsForReports();
      
      if (hostsData && hostsData.length > 0) {
        // Map HostListItemDTO sang HostOption với hostId thực sự
        const hostOptions: HostOption[] = hostsData
          .filter((host: HostListItemDTO) => host.status === "Active") // Chỉ lấy hosts active
          .map((host: HostListItemDTO) => ({
            hostId: host.hostId, // ✅ Sử dụng hostId thực sự từ API
            fullName: host.hostName || host.companyName || `Host #${host.hostId}`,
            email: host.email || "",
          }));
        
        // Sort theo tên để dễ tìm
        hostOptions.sort((a, b) => a.fullName.localeCompare(b.fullName));
        
        setHosts(hostOptions);
      } else {
        setHosts([]);
      }
    } catch (err: any) {
      toastError("Không thể tải danh sách host");
      setHosts([]);
    } finally {
      setLoadingHosts(false);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await adminAPI.getAllReports();
      // Đảm bảo data là array
      if (Array.isArray(data)) {
        setReports(data);
      } else if (data && typeof data === 'object' && 'data' in data && Array.isArray((data as any).data)) {
        // Nếu API trả về { data: [...] }
        setReports((data as any).data);
      } else {
        setReports([]);
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || "Không thể tải danh sách báo cáo");
      setReports([]); // Đảm bảo reports luôn là array
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReport = async () => {
    // Validation
    if (formData.reportType === "HostReport") {
      if (!formData.hostId || !formData.fromDate || !formData.toDate) {
        toastError("Vui lòng điền đầy đủ thông tin cho báo cáo Host");
        return;
      }
    } else if (formData.reportType === "RevenueReport") {
      if (!formData.year) {
        toastError("Vui lòng chọn năm cho báo cáo Doanh thu");
        return;
      }
      if (formData.hostId && formData.hostId <= 0) {
        toastError("Host ID phải lớn hơn 0 nếu được chỉ định");
        return;
      }
    } else if (formData.reportType === "AllHostsReport") {
      if (!formData.year) {
        toastError("Vui lòng chọn năm cho báo cáo Doanh thu tất cả hosts");
        return;
      }
      // AllHostsReport không cần hostId (hoặc có thể null)
      // Set hostId to null để đảm bảo backend hiểu là tất cả hosts
      formData.hostId = null;
    }

    setCreating(true);
    try {
      await adminAPI.createReport(formData);
      toastSuccess("Tạo báo cáo thành công!");
      setShowCreateForm(false);
      setFormData({
        reportType: "HostReport",
        hostId: undefined,
        fromDate: undefined,
        toDate: undefined,
        year: new Date().getFullYear(),
        month: null,
      });
      loadReports();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Không thể tạo báo cáo");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteReport = async (reportId: number) => {
    setDeletingReportId(reportId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingReportId) return;

    setShowConfirmModal(false);
    try {
      const reportId = deletingReportId;
      await adminAPI.deleteReport(reportId);
      toastSuccess("Xóa báo cáo thành công!");
      setDeletingReportId(null);
      loadReports();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Không thể xóa báo cáo");
    } finally {
      setDeletingReportId(null);
    }
  };

  const getReportTypeLabel = (type: string) => {
    if (type === "HostReport") return "Báo cáo Host";
    if (type === "AllHostsReport") return "Báo cáo Doanh thu Tất cả Hosts";
    return "Báo cáo Doanh thu";
  };

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "-";
      return date.toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch (error) {
      return "-";
    }
  };

  const getFileUrl = (fileName: string) => {
    const baseUrl = process.env.REACT_APP_API_URL?.replace("/api", "") || "http://localhost:7216";
    return `${baseUrl}/reports/${fileName}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            📊 Quản lý Báo cáo
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            Tạo và quản lý các báo cáo Excel cho hệ thống
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 font-semibold flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {showCreateForm ? "Đóng" : "Tạo báo cáo mới"}
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-white/20 dark:border-neutral-700/50">
          <h3 className="text-xl font-bold mb-4 text-neutral-900 dark:text-neutral-100">
            Tạo báo cáo mới
          </h3>
          <div className="space-y-4">
            {/* Report Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Loại báo cáo
              </label>
              <select
                value={formData.reportType}
                onChange={(e) => {
                  const newType = e.target.value as "HostReport" | "RevenueReport" | "AllHostsReport";
                  setFormData({ 
                    ...formData, 
                    reportType: newType,
                    // Reset hostId khi chuyển sang AllHostsReport
                    hostId: newType === "AllHostsReport" ? null : formData.hostId
                  });
                }}
                className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
              >
                <option value="HostReport">Báo cáo Host</option>
                <option value="RevenueReport">Báo cáo Doanh thu (Host cụ thể)</option>
                <option value="AllHostsReport">Báo cáo Doanh thu (Tất cả Hosts)</option>
              </select>
            </div>

            {/* Host Report Fields */}
            {formData.reportType === "HostReport" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Chọn Host
                  </label>
                  {loadingHosts ? (
                    <div className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Đang tải danh sách host...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.hostId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, hostId: e.target.value ? parseInt(e.target.value) : undefined })
                      }
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="">-- Chọn Host --</option>
                      {hosts.map((host) => (
                        <option key={host.hostId} value={host.hostId}>
                          {host.fullName} {host.email ? `(${host.email})` : ""} - ID: {host.hostId}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={formData.fromDate || ""}
                      onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={formData.toDate || ""}
                      onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Revenue Report Fields */}
            {formData.reportType === "RevenueReport" && (
              <>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Chọn Host (tùy chọn - để trống cho tất cả hosts)
                  </label>
                  {loadingHosts ? (
                    <div className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span className="text-sm text-neutral-500 dark:text-neutral-400">Đang tải danh sách host...</span>
                    </div>
                  ) : (
                    <select
                      value={formData.hostId || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, hostId: e.target.value ? parseInt(e.target.value) : null })
                      }
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                    >
                      <option value="">-- Tất cả Hosts --</option>
                      {hosts.map((host) => (
                        <option key={host.hostId} value={host.hostId}>
                          {host.fullName} {host.email ? `(${host.email})` : ""} - ID: {host.hostId}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Năm
                    </label>
                    <input
                      type="number"
                      value={formData.year || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })
                      }
                      min="2020"
                      max={new Date().getFullYear()}
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Tháng (tùy chọn)
                    </label>
                    <input
                      type="number"
                      value={formData.month || ""}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          month: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      min="1"
                      max="12"
                      placeholder="Để trống để lấy cả năm"
                      className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                    />
                  </div>
                </div>
              </>
            )}

            {/* All Hosts Report Fields */}
            {formData.reportType === "AllHostsReport" && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Năm <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.year || ""}
                    onChange={(e) =>
                      setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })
                    }
                    min="2020"
                    max={new Date().getFullYear()}
                    required
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Tháng (tùy chọn)
                  </label>
                  <input
                    type="number"
                    value={formData.month || ""}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        month: e.target.value ? parseInt(e.target.value) : null,
                      })
                    }
                    min="1"
                    max="12"
                    placeholder="Để trống để lấy cả năm"
                    className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-neutral-700 dark:text-neutral-100"
                  />
                </div>
                <div className="col-span-2">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      ℹ️ Báo cáo này sẽ tạo báo cáo doanh thu cho <strong>tất cả hosts</strong> trong hệ thống.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={handleCreateReport}
                disabled={creating}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {creating ? "Đang tạo..." : "Tạo báo cáo"}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-6 py-3 bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 text-neutral-700 dark:text-neutral-200 rounded-xl transition-colors"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 dark:border-neutral-700/50 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h3 className="text-xl font-bold text-neutral-900 dark:text-neutral-100">
            Danh sách báo cáo ({reports.length})
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-neutral-500 dark:text-neutral-400">Đang tải...</p>
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-500 dark:text-neutral-400">Chưa có báo cáo nào</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Loại
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Host
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Thời gian
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                {Array.isArray(reports) && reports.map((report) => (
                  <tr key={report.reportId} className="hover:bg-neutral-50 dark:hover:bg-neutral-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      #{report.reportId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                      {getReportTypeLabel(report.reportType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                      {report.hostName || report.hostId ? `Host #${report.hostId}` : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-700 dark:text-neutral-300">
                      {report.fromDate && report.toDate
                        ? `${formatDate(report.fromDate)} - ${formatDate(report.toDate)}`
                        : report.year
                          ? `${report.year}${report.month ? `/${String(report.month).padStart(2, '0')}` : ""}`
                          : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <a
                        href={getFileUrl(report.fileName)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        {report.fileName}
                      </a>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 dark:text-neutral-400">
                      {report.generatedDate ? formatDate(report.generatedDate) : formatDate(report.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleDeleteReport(report.reportId)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmModal
        show={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setDeletingReportId(null);
        }}
        onConfirm={confirmDelete}
        title="Xác nhận xóa báo cáo"
        message="Bạn có chắc chắn muốn xóa báo cáo này?"
        confirmText="Xóa"
        cancelText="Hủy"
        type="danger"
      />
    </div>
  );
};

export default PageAdminReports;

