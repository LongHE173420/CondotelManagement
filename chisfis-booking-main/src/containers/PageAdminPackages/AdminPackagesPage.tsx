// src/containers/PageAdminPackages/AdminPackagesPage.tsx
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import adminPackageAPI from 'api/adminPackageAPI';

interface PackageItem {
    hostPackageId: number;
    hostName: string;
    email: string;
    phone: string;
    packageName: string;
    orderCode: string;
    amount: number;
    status: string;
    startDate: string;
    endDate: string;
    canActivate: boolean;
}

const AdminPackagesPage: React.FC = () => {
    const [data, setData] = useState<PackageItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchText, setSearchText] = useState('');

    const fetchData = async (keyword = '') => {
        setLoading(true);
        try {
            const result = await adminPackageAPI.getAll(keyword || undefined);
            setData(result);
        } catch (err: any) {
            toast.error('Lấy dữ liệu thất bại: ' + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = () => {
        fetchData(searchText);
    };

    const handleActivate = async (id: number) => {
        if (!window.confirm('Bạn có chắc muốn kích hoạt gói này không?')) return;

        try {
            const res = await adminPackageAPI.activate(id);
            toast.success(res.message || 'Kích hoạt thành công!');
            fetchData(searchText);
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Kích hoạt thất bại!';
            toast.error(msg);
        }
    };

    const stats = {
        total: data.length,
        active: data.filter(item => item.status === 'Active').length,
        pending: data.filter(item => item.status === 'PendingPayment').length,
        other: data.filter(item => !['Active', 'PendingPayment'].includes(item.status)).length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="mb-8 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 rounded-2xl p-6 border border-sky-200/50 dark:border-sky-800/50">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Quản lý Gói Dịch vụ Host
                </h2>
                <p className="text-neutral-600 dark:text-neutral-400">
                    Xem danh sách gói đã mua • Kích hoạt thủ công cho Host
                </p>
            </div>

            {/* Search */}
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-sky-200/50 dark:border-sky-800/50">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-neutral-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Tìm theo tên, email, SĐT, OrderCode..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="block w-full pl-10 pr-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 dark:bg-neutral-700 dark:text-neutral-100"
                        />
                    </div>
                    <button
                        onClick={handleSearch}
                        className="px-8 py-3 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        Tìm kiếm
                    </button>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-2xl shadow-xl p-6 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center">
                        <div className="rounded-full bg-gradient-to-br from-blue-400 to-cyan-500 p-4 mr-4 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Tổng gói dịch vụ</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">{stats.total}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl shadow-xl p-6 border border-green-200/50 dark:border-green-800/50">
                    <div className="flex items-center">
                        <div className="rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-4 mr-4 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-green-600 dark:text-green-400">Đã kích hoạt</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">{stats.active}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl shadow-xl p-6 border border-orange-200/50 dark:border-orange-800/50">
                    <div className="flex items-center">
                        <div className="rounded-full bg-gradient-to-br from-orange-400 to-amber-500 p-4 mr-4 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Chờ thanh toán</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">{stats.pending}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 rounded-2xl shadow-xl p-6 border border-red-200/50 dark:border-red-800/50">
                    <div className="flex items-center">
                        <div className="rounded-full bg-gradient-to-br from-red-400 to-pink-500 p-4 mr-4 shadow-lg">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-red-600 dark:text-red-400">Cần xử lý</p>
                            <p className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">{stats.other}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-sky-200/50 dark:border-sky-800/50">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-sky-200 dark:border-sky-800"></div>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-sky-600 absolute top-0 left-0"></div>
                    </div>
                    <p className="mt-4 text-neutral-600 dark:text-neutral-400 font-medium">Đang tải dữ liệu...</p>
                </div>
            ) : (
                <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-sky-200/50 dark:border-sky-800/50">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-neutral-200 dark:divide-neutral-700">
                            <thead className="bg-gradient-to-r from-sky-50 to-blue-50 dark:from-neutral-700 dark:to-neutral-800">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Thông tin Host</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Gói dịch vụ</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">OrderCode</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Giá tiền</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Trạng thái</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Thời hạn</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-neutral-700 dark:text-neutral-200 uppercase tracking-wider">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-neutral-800 divide-y divide-neutral-200 dark:divide-neutral-700">
                                {data.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-16">
                                            <div className="flex flex-col items-center justify-center">
                                                <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-sky-400 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                                                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8V4a1 1 0 00-1-1h-2a1 1 0 00-1 1v1M9 7h6" />
                                                    </svg>
                                                </div>
                                                <p className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">Chưa có dữ liệu</p>
                                                <p className="text-neutral-600 dark:text-neutral-400">Hãy thử thay đổi từ khóa tìm kiếm</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    data.map((item) => (
                                        <tr key={item.hostPackageId} className="hover:bg-gradient-to-r hover:from-sky-50/50 hover:to-blue-50/50 dark:hover:from-neutral-700/50 dark:hover:to-neutral-800/50 transition-all duration-200">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-12 w-12 bg-gradient-to-br from-sky-100 to-blue-100 dark:from-sky-900/30 dark:to-blue-900/30 rounded-xl flex items-center justify-center shadow-md">
                                                        <svg className="w-6 h-6 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                                                        </svg>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-bold text-neutral-900 dark:text-neutral-100">{item.hostName}</div>
                                                        <div className="text-sm text-neutral-500 dark:text-neutral-400">{item.email}</div>
                                                        <div className="text-xs text-neutral-400 dark:text-neutral-500">{item.phone}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{item.packageName}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-mono font-bold text-sky-600 dark:text-sky-400 bg-gradient-to-r from-sky-50 to-blue-50 dark:from-sky-900/20 dark:to-blue-900/20 px-3 py-2 rounded-lg border border-sky-200 dark:border-sky-800">
                                                    {item.orderCode}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                                                    {item.amount.toLocaleString('vi-VN')}₫
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-3 py-1 text-xs font-bold rounded-lg shadow-md ${
                                                    item.status === 'Active'
                                                        ? 'bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-800'
                                                        : item.status === 'PendingPayment'
                                                            ? 'bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-800 dark:text-orange-200 border border-orange-200 dark:border-orange-800'
                                                            : 'bg-gradient-to-r from-red-100 to-pink-100 dark:from-red-900/30 dark:to-pink-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-800'
                                                }`}>
                                                    {item.status === 'Active'
                                                        ? 'Đã kích hoạt'
                                                        : item.status === 'PendingPayment'
                                                            ? 'Chờ thanh toán'
                                                            : 'Khác'
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm space-y-1">
                                                    <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                                                        <svg className="w-4 h-4 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="font-medium">Bắt đầu:</span>
                                                        <span className="ml-1">{item.startDate}</span>
                                                    </div>
                                                    <div className="flex items-center text-neutral-600 dark:text-neutral-400">
                                                        <svg className="w-4 h-4 mr-2 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        <span className="font-medium">Kết thúc:</span>
                                                        <span className="ml-1">{item.endDate}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleActivate(item.hostPackageId)}
                                                    disabled={!item.canActivate}
                                                    className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 ${
                                                        item.canActivate
                                                            ? 'bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPackagesPage;
