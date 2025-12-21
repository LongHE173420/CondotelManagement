import React, { useState, useEffect } from "react";
import axiosClient from "api/axiosClient";
import { packageAPI, PackageDto, HostPackageDetailsDto } from "api/package";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { Helmet } from "react-helmet";

const PricingPage: React.FC = () => {
    const [packages, setPackages] = useState<PackageDto[]>([]);
    const [currentPackage, setCurrentPackage] = useState<HostPackageDetailsDto | null>(null);
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Load available packages
                const packagesData = await packageAPI.getAllPackages();
                const sorted = [...packagesData].sort((a, b) => a.price - b.price);
                setPackages(sorted);

                // Load current host package
                try {
                    const myPackage = await packageAPI.getMyPackage();
                    setCurrentPackage(myPackage);
                } catch (err) {
                    // If 404 or 400, it's okay (no package yet)
                    setCurrentPackage(null);
                }
            } catch (error) {
                toast.error("Không thể tải danh sách gói dịch vụ.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handlePurchase = async (pkg: PackageDto) => {
        // Check if user is trying to purchase the same active package
        if (currentPackage && currentPackage.status === "Active" && currentPackage.packageName === pkg.name) {
            toast.warning("Bạn đang sử dụng gói này rồi!");
            return;
        }

        // If user has an active package, only allow upgrading (higher packageId)
        if (currentPackage && currentPackage.status === "Active") {
            const currentPkg = packages.find(p => p.name === currentPackage.packageName);
            if (currentPkg && pkg.packageId <= currentPkg.packageId) {
                toast.warning("Bạn chỉ có thể nâng cấp lên gói cao hơn!");
                return;
            }
        }

        // Show confirmation
        const confirm = window.confirm(`Bạn có chắc chắn muốn mua gói "${pkg.name}" với giá ${pkg.price.toLocaleString("vi-VN")} VNĐ?`);
        if (!confirm) return;

        setPurchaseLoading(pkg.packageId);
        try {
            const result = await packageAPI.purchasePackage(pkg.packageId);
            toast.success(result.message || "✅ Đã tạo đơn hàng!");

            const paymentResponse = await axiosClient.post("/payment/create-package-payment", {
                OrderCode: result.orderCode!.toString(),
                Amount: result.amount!,
                Description: `Nâng cấp gói ${pkg.name}`
            });

            const data: any = paymentResponse.data;
            const checkoutUrl = data?.checkoutUrl || data?.data?.checkoutUrl;

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                toast.error("Không nhận được link thanh toán từ PayOS");
            }
        } catch (error: any) {
            // Check if error message indicates already having highest package
            const errorMsg = error.response?.data?.message || error.message || "Mua gói thất bại";
            toast.error(errorMsg);

            // If error is about highest package, disable the button for highest package?
            if (errorMsg.includes("cao nhất")) {
                // Optionally, you can set a state to disable the button for the highest package
            }
        } finally {
            setPurchaseLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg font-medium">Đang tải bảng giá...</p>
                </div>
            </div>
        );
    }

    // Find the highest package (assuming sorted by price)
    const highestPackage = packages.length > 0 ? packages[packages.length - 1] : null;

    return (
        <>
            <Helmet>
                <title>Bảng giá - Nâng cấp tài khoản</title>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* Header Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12">
                    <div className="text-center max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span>Ưu đãi đặc biệt</span>
                        </div>

                        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4 leading-tight">
                            Nâng cấp tài khoản của bạn
                        </h1>

                        <p className="text-lg text-gray-600 leading-relaxed">
                            Chọn gói phù hợp để đăng nhiều condotel hơn, tiếp cận hàng nghìn khách hàng tiềm năng!
                        </p>

                        {/* Display current package if any */}
                        {currentPackage && currentPackage.status === "Active" && (
                            <div className="mt-6 inline-flex items-center gap-2 bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>Gói hiện tại: {currentPackage.packageName} (Hết hạn: {currentPackage.endDate})</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pricing Cards */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                    <div className={`grid gap-8 ${packages.length === 2 ? 'md:grid-cols-2 max-w-4xl' : packages.length === 3 ? 'md:grid-cols-3 max-w-6xl' : 'md:grid-cols-2 lg:grid-cols-4'} mx-auto`}>
                        {packages.map((pkg) => {
                            const isPremium = highestPackage?.packageId === pkg.packageId;
                            const isCurrentPackage = currentPackage && currentPackage.status === "Active" && currentPackage.packageName === pkg.name;
                            const isLowerPackage = currentPackage && currentPackage.status === "Active" && packages.findIndex(p => p.name === currentPackage.packageName) >= packages.findIndex(p => p.name === pkg.name);

                            return (
                                <div
                                    key={pkg.packageId}
                                    className={`relative bg-white rounded-2xl transition-all duration-300 hover:shadow-2xl ${isPremium
                                        ? "ring-2 ring-purple-500 shadow-xl md:scale-105"
                                        : "shadow-lg hover:scale-105"
                                        } ${isCurrentPackage ? "ring-2 ring-green-500" : ""}`}
                                >
                                    {/* Current Package Badge */}
                                    {isCurrentPackage && (
                                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
                                            <div className="bg-green-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-lg">
                                                ĐANG SỬ DỤNG
                                            </div>
                                        </div>
                                    )}

                                    {/* Premium Badge */}
                                    {isPremium && !isCurrentPackage && (
                                        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                                            <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-2 rounded-full text-sm font-bold shadow-lg">
                                                PHỔ BIẾN NHẤT
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-8">
                                        {/* Package Name */}
                                        <h3 className={`text-2xl font-bold mb-2 ${isPremium ? "text-purple-600" : "text-gray-900"}`}>
                                            {pkg.name}
                                        </h3>

                                        {/* Price */}
                                        <div className="mb-6">
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-gray-900">
                                                    {pkg.price.toLocaleString("vi-VN")}
                                                </span>
                                                <span className="text-gray-500 text-lg">VNĐ</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <span>Thời hạn: {pkg.duration} ngày</span>
                                            </div>
                                        </div>

                                        {/* Features List */}
                                        <ul className="space-y-4 mb-8">
                                            <li className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700">
                                                    Đăng tối đa <strong>{pkg.maxListings} condotel</strong>
                                                </span>
                                            </li>

                                            <li className="flex items-start gap-3">
                                                <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 ${pkg.canUseFeaturedListing ? "bg-green-100" : "bg-gray-100"
                                                    }`}>
                                                    {pkg.canUseFeaturedListing ? (
                                                        <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                        </svg>
                                                    ) : (
                                                        <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                        </svg>
                                                    )}
                                                </div>
                                                <span className={pkg.canUseFeaturedListing ? "text-gray-700" : "text-gray-400"}>
                                                    {pkg.canUseFeaturedListing ? "Được đăng blog nổi bật" : "Không hỗ trợ blog nổi bật"}
                                                </span>
                                            </li>

                                            <li className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700">Hỗ trợ kỹ thuật 24/7</span>
                                            </li>

                                            <li className="flex items-start gap-3">
                                                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                                                    <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                                <span className="text-gray-700">Thống kê chi tiết lượt xem</span>
                                            </li>

                                            {isPremium && (
                                                <>
                                                    <li className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                                                            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-gray-700 font-medium">Badge "Đã xác minh"</span>
                                                    </li>

                                                    <li className="flex items-start gap-3">
                                                        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center mt-0.5">
                                                            <svg className="w-3 h-3 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-gray-700 font-medium">Ưu tiên hiển thị cao nhất</span>
                                                    </li>
                                                </>
                                            )}
                                        </ul>

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => handlePurchase(pkg)}
                                            disabled={
                                                purchaseLoading === pkg.packageId ||
                                                isCurrentPackage ||
                                                !!(currentPackage && currentPackage.status === "Active" && isLowerPackage)
                                            }
                                            className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${isPremium
                                                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg hover:shadow-xl hover:from-purple-700 hover:to-pink-700"
                                                : "bg-gray-900 text-white hover:bg-gray-800 shadow-md hover:shadow-lg"
                                                }`}
                                        >
                                            {purchaseLoading === pkg.packageId ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                    Đang xử lý...
                                                </span>
                                            ) : isCurrentPackage ? (
                                                "Đang sử dụng"
                                            ) : currentPackage && currentPackage.status === "Active" && isLowerPackage ? (
                                                "Không thể chọn"
                                            ) : (
                                                "Chọn gói này ngay"
                                            )}
                                        </button>

                                        {isPremium && (
                                            <p className="text-center text-sm text-gray-500 mt-4">
                                                ⭐ Được hơn 500 chủ nhà tin dùng
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* How It Works Section */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
                        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
                            Hướng dẫn thanh toán
                        </h2>

                        <div className="grid md:grid-cols-3 gap-8">
                            <div className="text-center">
                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl font-bold text-blue-600">1</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-900">Chọn gói</h3>
                                <p className="text-gray-600">
                                    Lựa chọn gói dịch vụ phù hợp với nhu cầu của bạn
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl font-bold text-purple-600">2</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-900">Thanh toán</h3>
                                <p className="text-gray-600">
                                    Thanh toán an toàn qua hệ thống PayOS
                                </p>
                            </div>

                            <div className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                    <span className="text-3xl font-bold text-green-600">3</span>
                                </div>
                                <h3 className="text-xl font-semibold mb-2 text-gray-900">Bắt đầu sử dụng</h3>
                                <p className="text-gray-600">
                                    Kích hoạt ngay và bắt đầu đăng tin condotel
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Support CTA */}
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
                    <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl shadow-2xl p-8 md:p-12 text-center text-white">
                        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h2 className="text-3xl font-bold mb-4">Cần hỗ trợ thêm?</h2>
                        <p className="text-blue-100 mb-6 text-lg max-w-2xl mx-auto">
                            Liên hệ với đội ngũ hỗ trợ của chúng tôi để được tư vấn chi tiết về các gói dịch vụ
                        </p>
                        <button
                            onClick={() => navigate("/chat")}
                            className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                        >
                            Liên hệ hỗ trợ ngay
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default PricingPage;