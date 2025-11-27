// src/containers/PageAdminPackages/AdminPackagesPage.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

    return (
        <div className="p-6 bg-white min-h-screen">
            {/* Tiêu đề */}
            <h1 className="text-3xl font-bold text-gray-900 mb-8">
                Quản lý Gói Dịch Vụ Host
            </h1>

            {/* Ô tìm kiếm */}
            <div className="mb-6 flex gap-3 max-w-2xl">
                <input
                    type="text"
                    placeholder="Tìm theo tên, email, SĐT, OrderCode..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                    onClick={handleSearch}
                    className="px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                    Tìm kiếm
                </button>
            </div>

            {/* Bảng dữ liệu */}
            {loading ? (
                <div className="text-center py-20">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="overflow-x-auto shadow-lg rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên Host</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SĐT</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Gói</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">OrderCode</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá tiền</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bắt đầu</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kết thúc</th>
                                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={10} className="text-center py-10 text-gray-500">
                                        Chưa có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                data.map((item) => (
                                    <tr key={item.hostPackageId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.hostName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.email}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.phone}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.packageName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{item.orderCode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                            {item.amount.toLocaleString('vi-VN')}₫
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${item.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                item.status === 'PendingPayment' ? 'bg-orange-100 text-orange-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                {item.status === 'Active' ? 'Đã kích hoạt' :
                                                    item.status === 'PendingPayment' ? 'Chờ thanh toán' : 'Khác'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.startDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{item.endDate}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <button
                                                onClick={() => handleActivate(item.hostPackageId)}
                                                disabled={!item.canActivate}
                                                className={`px-4 py-2 rounded font-medium transition ${item.canActivate
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                            >
                                                Kích hoạt ngay
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPackagesPage;