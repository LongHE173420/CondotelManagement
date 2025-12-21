// src/containers/PageAdminPackages/AdminPackagesPage.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminPackageAPI, { HostPackageItem, CatalogPackage } from 'api/adminPackageAPI';
import AdminPackageCatalog from './AdminPackageCatalog';
import ConfirmModal from 'components/ConfirmModal';

const AdminPackagesPage: React.FC = () => {
    // State cho phần quản lý đơn hàng (HostPackages)
    const [ordersData, setOrdersData] = useState<HostPackageItem[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [searchText, setSearchText] = useState('');

    // State cho phần quản lý danh mục gói (Catalog)
    const [catalogData, setCatalogData] = useState<CatalogPackage[]>([]);
    const [loadingCatalog, setLoadingCatalog] = useState(false);
    const [activeTab, setActiveTab] = useState<'orders' | 'catalog'>('orders');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [confirmModalData, setConfirmModalData] = useState<{ id: number; type: 'activate' | 'delete' }>({ id: 0, type: 'activate' });

    // ==========================================
    // PHẦN 1: QUẢN LÝ ĐƠN HÀNG (HostPackages)
    // ==========================================

    const fetchOrdersData = async (keyword = '') => {
        setLoadingOrders(true);
        try {
            const result = await adminPackageAPI.getAll(keyword || undefined);
            setOrdersData(result);
        } catch (err: any) {
            toast.error('Lấy dữ liệu đơn hàng thất bại: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoadingOrders(false);
        }
    };

    const handleSearch = () => {
        fetchOrdersData(searchText);
    };

    const handleActivate = async (id: number) => {
        setConfirmModalData({ id, type: 'activate' });
        setShowConfirmModal(true);
    };

    const confirmActivate = async () => {
        setShowConfirmModal(false);
        const id = confirmModalData.id;
        try {
            const res = await adminPackageAPI.activate(id);
            toast.success(res.message || 'Kích hoạt thành công!');
            fetchOrdersData(searchText);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Kích hoạt thất bại!';
            toast.error(msg);
        }
    };

    // ==========================================
    // PHẦN 2: QUẢN LÝ DANH MỤC GÓI (Catalog)
    // ==========================================

    const fetchCatalogData = async () => {
        setLoadingCatalog(true);
        try {
            const data = await adminPackageAPI.getCatalog();
            setCatalogData(data);
        } catch (err: any) {
            toast.error('Lấy danh mục gói thất bại: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoadingCatalog(false);
        }
    };

    const handleCatalogCreate = async (data: any) => {
        try {
            await adminPackageAPI.createCatalog(data);
            toast.success('Tạo gói mới thành công!');
            fetchCatalogData();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Tạo gói thất bại!');
            return false;
        }
    };

    const handleCatalogUpdate = async (id: number, data: any) => {
        try {
            await adminPackageAPI.updateCatalog(id, data);
            toast.success('Cập nhật gói thành công!');
            fetchCatalogData();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Cập nhật thất bại!');
            return false;
        }
    };

    const handleCatalogDelete = async (id: number) => {
        setConfirmModalData({ id, type: 'delete' });
        setShowConfirmModal(true);
        return true; // Will be handled by modal
    };

    const confirmDelete = async () => {
        setShowConfirmModal(false);
        const id = confirmModalData.id;
        try {
            await adminPackageAPI.deleteCatalog(id);
            toast.success('Xóa gói thành công!');
            fetchCatalogData();
            return true;
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Xóa gói thất bại!');
            return false;
        }
    };

    // Gọi API khi thay đổi tab
    useEffect(() => {
        if (activeTab === 'orders') {
            fetchOrdersData();
        } else {
            fetchCatalogData();
        }
    }, [activeTab]);

    // Refresh data khi chuyển tab
    const handleTabChange = (tab: 'orders' | 'catalog') => {
        setActiveTab(tab);
    };

    // Thống kê nhanh cho đơn hàng
    const ordersStats = {
        total: ordersData.length,
        active: ordersData.filter(item => item.status === 'Active').length,
        pending: ordersData.filter(item => item.status === 'PendingPayment').length,
        other: ordersData.filter(item => !['Active', 'PendingPayment'].includes(item.status)).length
    };

    // Thống kê cho danh mục gói
    const catalogStats = {
        total: catalogData.length,
        active: catalogData.filter(item => item.isActive).length,
        inactive: catalogData.filter(item => !item.isActive).length
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Quản lý Gói Dịch Vụ</h1>
                <p className="text-gray-600 mt-2">Quản lý đơn hàng và danh mục gói dịch vụ cho Host</p>
            </div>

            {/* Tab Navigation */}
            <div className="mb-6 bg-white rounded-xl shadow-sm p-1">
                <div className="flex">
                    <button
                        onClick={() => handleTabChange('orders')}
                        className={`flex-1 py-3 px-4 text-center font-medium text-sm rounded-lg transition-all ${activeTab === 'orders'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                    >
                        <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            Đơn hàng
                            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {ordersStats.total}
                            </span>
                        </span>
                    </button>
                    <button
                        onClick={() => handleTabChange('catalog')}
                        className={`flex-1 py-3 px-4 text-center font-medium text-sm rounded-lg transition-all ${activeTab === 'catalog'
                            ? 'bg-green-50 text-green-700 border border-green-200 shadow-sm'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                            }`}
                    >
                        <span className="flex items-center justify-center">
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                            </svg>
                            Danh mục gói
                            <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-0.5 rounded-full">
                                {catalogStats.total}
                            </span>
                        </span>
                    </button>
                </div>
            </div>

            {/* Nội dung theo tab */}
            {activeTab === 'orders' ? (
                <>
                    {/* Search Bar và Stats */}
                    <div className="space-y-4 mb-6">
                        <div className="bg-white rounded-xl shadow-sm p-4">
                            <div className="flex flex-col lg:flex-row gap-4">
                                <div className="flex-1 relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        placeholder="Tìm theo tên, email, SĐT, OrderCode..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                        className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSearchText('')}
                                        className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
                                    >
                                        Xóa
                                    </button>
                                    <button
                                        onClick={handleSearch}
                                        className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
                                    >
                                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                        </svg>
                                        Tìm kiếm
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Stats Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex items-center">
                                    <div className="rounded-full bg-blue-100 p-3 mr-4">
                                        <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Đã kích hoạt</p>
                                        <p className="text-xl font-bold text-gray-800">{ordersStats.active}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex items-center">
                                    <div className="rounded-full bg-orange-100 p-3 mr-4">
                                        <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Chờ thanh toán</p>
                                        <p className="text-xl font-bold text-gray-800">{ordersStats.pending}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex items-center">
                                    <div className="rounded-full bg-red-100 p-3 mr-4">
                                        <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Cần xử lý</p>
                                        <p className="text-xl font-bold text-gray-800">{ordersStats.other}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white rounded-xl shadow-sm p-4">
                                <div className="flex items-center">
                                    <div className="rounded-full bg-green-100 p-3 mr-4">
                                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-500">Tổng gói</p>
                                        <p className="text-xl font-bold text-gray-800">{ordersStats.total}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Data Table */}
                    {loadingOrders ? (
                        <div className="flex justify-center items-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            <span className="ml-3 text-gray-600">Đang tải dữ liệu...</span>
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {ordersData.length === 0 ? (
                                <div className="text-center py-16">
                                    <svg className="w-20 h-20 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">Không có đơn hàng nào</h3>
                                    <p className="text-gray-500 mb-6">Hãy thử thay đổi từ khóa tìm kiếm</p>
                                    <button
                                        onClick={() => {
                                            setSearchText('');
                                            fetchOrdersData();
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Làm mới
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Host</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gói dịch vụ</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã đơn</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá tiền</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời hạn</th>
                                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {ordersData.map((item) => (
                                                <tr key={item.hostPackageId} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                                </svg>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{item.hostName}</div>
                                                                <div className="text-sm text-gray-500">{item.email}</div>
                                                                <div className="text-xs text-gray-400">{item.phone}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-medium text-gray-900">{item.packageName}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-mono text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border">
                                                            {item.orderCode}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm font-bold text-gray-900">
                                                            {item.amount.toLocaleString('vi-VN')}₫
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-full ${item.status === 'Active'
                                                            ? 'bg-green-100 text-green-800'
                                                            : item.status === 'PendingPayment'
                                                                ? 'bg-orange-100 text-orange-800'
                                                                : 'bg-red-100 text-red-800'
                                                            }`}>
                                                            {item.status === 'Active'
                                                                ? 'Đã kích hoạt'
                                                                : item.status === 'PendingPayment'
                                                                    ? 'Chờ thanh toán'
                                                                    : item.status
                                                            }
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="text-sm space-y-1">
                                                            <div className="flex items-center text-gray-600">
                                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <span>{item.startDate}</span>
                                                            </div>
                                                            <div className="flex items-center text-gray-600">
                                                                <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                <span>{item.endDate}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <button
                                                            onClick={() => handleActivate(item.hostPackageId)}
                                                            disabled={!item.canActivate}
                                                            className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${item.canActivate
                                                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow'
                                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                                }`}
                                                        >
                                                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                            </svg>
                                                            Kích hoạt
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </>
            ) : (
                <>
                    {/* Header cho Catalog */}
                    <div className="mb-6">
                        <div className="bg-white rounded-xl shadow-sm p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">Danh mục Gói Dịch Vụ</h2>
                                    <p className="text-gray-600 mt-1">Tạo và quản lý các gói dịch vụ cho host đăng ký</p>
                                </div>
                                <div className="flex gap-3">
                                    <button
                                        onClick={fetchCatalogData}
                                        className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center"
                                    >
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                        Làm mới
                                    </button>
                                    <div className="flex gap-2">
                                        <div className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                                            Hoạt động: {catalogStats.active}
                                        </div>
                                        <div className="px-3 py-2 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
                                            Ngưng: {catalogStats.inactive}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Component quản lý danh mục gói */}
                    <AdminPackageCatalog
                        data={catalogData}
                        loading={loadingCatalog}
                        onCreate={handleCatalogCreate}
                        onUpdate={handleCatalogUpdate}
                        onDelete={handleCatalogDelete}
                        onRefresh={fetchCatalogData}
                    />
                </>
            )}
        </div>
    );
};

export default AdminPackagesPage;
