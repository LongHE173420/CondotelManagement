// src/containers/PageAdminPackages/AdminPackageCatalog.tsx
import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { CatalogPackage } from 'api/adminPackageAPI';

interface AdminPackageCatalogProps {
    data: CatalogPackage[];
    loading: boolean;
    onCreate: (data: any) => Promise<boolean>;
    onUpdate: (id: number, data: any) => Promise<boolean>;
    onDelete: (id: number) => Promise<boolean>;
    onRefresh: () => void;
}

const AdminPackageCatalog: React.FC<AdminPackageCatalogProps> = ({
    data,
    loading,
    onCreate,
    onUpdate,
    onDelete,
    onRefresh
}) => {
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPackage, setSelectedPackage] = useState<CatalogPackage | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        durationDays: '',
        description: '',
        isActive: true,

        // ======== THÊM CÁC TRƯỜNG FEATURES ========
        maxListingCount: '0',
        canUseFeaturedListing: false,
        maxBlogRequestsPerMonth: '0',
        isVerifiedBadgeEnabled: false,
        displayColorTheme: 'default',
        priorityLevel: '0'
    });

    const handleCreateClick = () => {
        setFormData({
            name: '',
            price: '',
            durationDays: '30',
            description: '',
            isActive: true,

            // ======== THÊM CÁC TRƯỜNG FEATURES MẶC ĐỊNH ========
            maxListingCount: '3',
            canUseFeaturedListing: false,
            maxBlogRequestsPerMonth: '0',
            isVerifiedBadgeEnabled: false,
            displayColorTheme: 'default',
            priorityLevel: '5'
        });
        setShowCreateModal(true);
    };

    const handleEditClick = (pkg: CatalogPackage) => {
        setSelectedPackage(pkg);
        setFormData({
            name: pkg.name,
            price: pkg.price.toString(),
            durationDays: pkg.durationDays?.toString() || '30',
            description: pkg.description || '',
            isActive: pkg.isActive,

            // ======== THÊM CÁC TRƯỜNG FEATURES ========
            maxListingCount: pkg.maxListingCount.toString(),
            canUseFeaturedListing: pkg.canUseFeaturedListing,
            maxBlogRequestsPerMonth: pkg.maxBlogRequestsPerMonth.toString(),
            isVerifiedBadgeEnabled: pkg.isVerifiedBadgeEnabled,
            displayColorTheme: pkg.displayColorTheme,
            priorityLevel: pkg.priorityLevel.toString()
        });
        setShowEditModal(true);
    };

    const handleSubmitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        const submitData = {
            name: formData.name,
            price: parseFloat(formData.price),
            durationDays: parseInt(formData.durationDays),
            description: formData.description,
            isActive: formData.isActive,

            // ======== THÊM CÁC TRƯỜNG FEATURES ========
            maxListingCount: parseInt(formData.maxListingCount),
            canUseFeaturedListing: formData.canUseFeaturedListing,
            maxBlogRequestsPerMonth: parseInt(formData.maxBlogRequestsPerMonth),
            isVerifiedBadgeEnabled: formData.isVerifiedBadgeEnabled,
            displayColorTheme: formData.displayColorTheme,
            priorityLevel: parseInt(formData.priorityLevel)
        };

        const success = await onCreate(submitData);
        if (success) {
            setShowCreateModal(false);
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPackage) return;

        const submitData = {
            name: formData.name,
            price: parseFloat(formData.price),
            durationDays: parseInt(formData.durationDays),
            description: formData.description,
            isActive: formData.isActive,

            // ======== THÊM CÁC TRƯỜNG FEATURES ========
            maxListingCount: parseInt(formData.maxListingCount),
            canUseFeaturedListing: formData.canUseFeaturedListing,
            maxBlogRequestsPerMonth: parseInt(formData.maxBlogRequestsPerMonth),
            isVerifiedBadgeEnabled: formData.isVerifiedBadgeEnabled,
            displayColorTheme: formData.displayColorTheme,
            priorityLevel: parseInt(formData.priorityLevel)
        };

        const success = await onUpdate(selectedPackage.packageId, submitData);
        if (success) {
            setShowEditModal(false);
            setSelectedPackage(null);
        }
    };

    const handleToggleStatus = async (pkg: CatalogPackage) => {
        const newStatus = !pkg.isActive;
        const success = await onUpdate(pkg.packageId, {
            name: pkg.name,
            price: pkg.price,
            durationDays: pkg.durationDays || 30,
            description: pkg.description || '',
            isActive: newStatus,

            // ======== GIỮ NGUYÊN CÁC TRƯỜNG FEATURES ========
            maxListingCount: pkg.maxListingCount,
            canUseFeaturedListing: pkg.canUseFeaturedListing,
            maxBlogRequestsPerMonth: pkg.maxBlogRequestsPerMonth,
            isVerifiedBadgeEnabled: pkg.isVerifiedBadgeEnabled,
            displayColorTheme: pkg.displayColorTheme,
            priorityLevel: pkg.priorityLevel
        });

        if (success) {
            toast.success(`${newStatus ? 'Kích hoạt' : 'Vô hiệu hóa'} gói thành công!`);
        }
    };

    // Options cho Display Color Theme
    const colorThemes = [
        { value: 'default', label: 'Mặc định' },
        { value: 'premium-gold', label: 'Vàng cao cấp' },
        { value: 'blue', label: 'Xanh dương' },
        { value: 'green', label: 'Xanh lá' },
        { value: 'purple', label: 'Tím' },
        { value: 'red', label: 'Đỏ' }
    ];

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <>
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Danh sách gói dịch vụ ({data.length} gói)
                        </h3>
                        <button
                            onClick={handleCreateClick}
                            className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Thêm gói mới
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tên gói</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá tiền</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thời hạn (ngày)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số condotel</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tin nổi bật</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blog/tháng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-10 text-gray-500">
                                        <div className="flex flex-col items-center">
                                            <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            <p className="text-lg font-medium text-gray-900">Chưa có gói dịch vụ nào</p>
                                            <p className="text-gray-500">Hãy tạo gói dịch vụ đầu tiên</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                data.map((pkg) => (
                                    <tr key={pkg.packageId} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">{pkg.name}</div>
                                            <div className="text-xs text-gray-500 flex items-center mt-1">
                                                <div className={`w-3 h-3 rounded-full mr-2 ${pkg.displayColorTheme === 'premium-gold' ? 'bg-yellow-500' :
                                                    pkg.displayColorTheme === 'blue' ? 'bg-blue-500' :
                                                        pkg.displayColorTheme === 'green' ? 'bg-green-500' :
                                                            pkg.displayColorTheme === 'purple' ? 'bg-purple-500' :
                                                                pkg.displayColorTheme === 'red' ? 'bg-red-500' : 'bg-gray-400'}`} />
                                                <span className="capitalize">{pkg.displayColorTheme.replace('-', ' ')}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-bold text-gray-900">
                                                {pkg.price.toLocaleString('vi-VN')}₫
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">
                                                {pkg.durationDays} ngày
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-gray-900">
                                                {pkg.maxListingCount}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${pkg.canUseFeaturedListing
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {pkg.canUseFeaturedListing ? '✓ Có' : '✗ Không'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-600">
                                                {pkg.maxBlogRequestsPerMonth}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleStatus(pkg)}
                                                className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${pkg.isActive
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                    }`}
                                            >
                                                {pkg.isActive ? 'Đang hoạt động' : 'Ngưng hoạt động'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEditClick(pkg)}
                                                    className="px-3 py-1 text-sm bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition"
                                                >
                                                    Sửa
                                                </button>
                                                <button
                                                    onClick={() => onDelete(pkg.packageId)}
                                                    className="px-3 py-1 text-sm bg-red-100 text-red-700 hover:bg-red-200 rounded-lg transition"
                                                >
                                                    Xóa
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

            {/* Modals */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Tạo gói dịch vụ mới</h3>
                        </div>
                        <form onSubmit={handleSubmitCreate}>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cột 1: Thông tin cơ bản */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên gói *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá tiền (VNĐ) *</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn (ngày) *</label>
                                        <input
                                            type="number"
                                            value={formData.durationDays}
                                            onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Cột 2: Tính năng */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số condotel tối đa *</label>
                                        <input
                                            type="number"
                                            value={formData.maxListingCount}
                                            onChange={(e) => setFormData({ ...formData, maxListingCount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số blog tối đa mỗi tháng *</label>
                                        <input
                                            type="number"
                                            value={formData.maxBlogRequestsPerMonth}
                                            onChange={(e) => setFormData({ ...formData, maxBlogRequestsPerMonth: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc hiển thị</label>
                                        <select
                                            value={formData.displayColorTheme}
                                            onChange={(e) => setFormData({ ...formData, displayColorTheme: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {colorThemes.map(theme => (
                                                <option key={theme.value} value={theme.value}>
                                                    {theme.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên (1-10)</label>
                                        <input
                                            type="number"
                                            value={formData.priorityLevel}
                                            onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            max="10"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="canUseFeaturedListing"
                                                checked={formData.canUseFeaturedListing}
                                                onChange={(e) => setFormData({ ...formData, canUseFeaturedListing: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="canUseFeaturedListing" className="ml-2 text-sm text-gray-700">
                                                Được đăng tin nổi bật
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="isVerifiedBadgeEnabled"
                                                checked={formData.isVerifiedBadgeEnabled}
                                                onChange={(e) => setFormData({ ...formData, isVerifiedBadgeEnabled: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="isVerifiedBadgeEnabled" className="ml-2 text-sm text-gray-700">
                                                Hiển thị badge "Đã xác minh"
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="isActive"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                                                Kích hoạt ngay sau khi tạo
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                >
                                    Tạo gói
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEditModal && selectedPackage && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl shadow-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-800">Chỉnh sửa gói dịch vụ</h3>
                            <p className="text-sm text-gray-600 mt-1">ID: {selectedPackage.packageId}</p>
                        </div>
                        <form onSubmit={handleSubmitEdit}>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Cột 1: Thông tin cơ bản */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tên gói *</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Giá tiền (VNĐ) *</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Thời hạn (ngày) *</label>
                                        <input
                                            type="number"
                                            value={formData.durationDays}
                                            onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="1"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            rows={3}
                                        />
                                    </div>
                                </div>

                                {/* Cột 2: Tính năng */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số condotel tối đa *</label>
                                        <input
                                            type="number"
                                            value={formData.maxListingCount}
                                            onChange={(e) => setFormData({ ...formData, maxListingCount: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Số blog tối đa mỗi tháng *</label>
                                        <input
                                            type="number"
                                            value={formData.maxBlogRequestsPerMonth}
                                            onChange={(e) => setFormData({ ...formData, maxBlogRequestsPerMonth: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Màu sắc hiển thị</label>
                                        <select
                                            value={formData.displayColorTheme}
                                            onChange={(e) => setFormData({ ...formData, displayColorTheme: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {colorThemes.map(theme => (
                                                <option key={theme.value} value={theme.value}>
                                                    {theme.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Mức độ ưu tiên (1-10)</label>
                                        <input
                                            type="number"
                                            value={formData.priorityLevel}
                                            onChange={(e) => setFormData({ ...formData, priorityLevel: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            min="0"
                                            max="10"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="editCanUseFeaturedListing"
                                                checked={formData.canUseFeaturedListing}
                                                onChange={(e) => setFormData({ ...formData, canUseFeaturedListing: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="editCanUseFeaturedListing" className="ml-2 text-sm text-gray-700">
                                                Được đăng tin nổi bật
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="editIsVerifiedBadgeEnabled"
                                                checked={formData.isVerifiedBadgeEnabled}
                                                onChange={(e) => setFormData({ ...formData, isVerifiedBadgeEnabled: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="editIsVerifiedBadgeEnabled" className="ml-2 text-sm text-gray-700">
                                                Hiển thị badge "Đã xác minh"
                                            </label>
                                        </div>
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="editIsActive"
                                                checked={formData.isActive}
                                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <label htmlFor="editIsActive" className="ml-2 text-sm text-gray-700">
                                                Gói đang hoạt động
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedPackage(null);
                                    }}
                                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                                >
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
};

export default AdminPackageCatalog;