import React, { useState, useEffect } from "react";
import axiosClient from "api/axiosClient"; // ← DÒNG NÀY BẠN CHƯA CÓ → THÊM VÀO NGAY!
// Giả định PackageAPI có hàm purchasePackage trả về { paymentUrl: string }
import { packageAPI, PackageDto } from "api/package";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import { Helmet } from "react-helmet";
import paymentAPI from "api/payment";

const PricingPage: React.FC = () => {
    const [packages, setPackages] = useState<PackageDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchaseLoading, setPurchaseLoading] = useState<number | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPackages = async () => {
            try {
                setLoading(true);
                // Giả định packageAPI.getAllPackages đã tồn tại
                const data = await packageAPI.getAllPackages();
                setPackages(data);
            } catch (error) {
                toast.error("Không thể tải danh sách gói dịch vụ.");
            } finally {
                setLoading(false);
            }
        };
        fetchPackages();
    }, []);

    const handlePurchase = async (pkg: PackageDto) => {
        if (!window.confirm(`Xác nhận mua gói "${pkg.name}" - ${pkg.price.toLocaleString("vi-VN")} VNĐ?`)) {
            return;
        }

        setPurchaseLoading(pkg.packageId);

        try {
            // B1: Gọi backend tạo đơn + lấy orderCode + amount
            const result = await packageAPI.purchasePackage(pkg.packageId);

            toast.success(result.message || "Đã tạo đơn hàng!");

            // B2: Gọi PayOS để tạo link thanh toán
            // Gọi thẳng endpoint mới – không cần thêm hàm
            const paymentResponse = await axiosClient.post("/payment/create-package-payment", {
                OrderCode: result.orderCode!.toString(),
                Amount: result.amount!,
                Description: `Nâng cấp gói ${pkg.name}`
            });

            // B3: Chuyển hướng đến PayOS – FIX 100% TypeScript
            const responseData = paymentResponse.data as any;
            const checkoutUrl = responseData?.checkoutUrl || responseData?.data?.checkoutUrl;

            if (checkoutUrl) {
                window.location.href = checkoutUrl;
            } else {
                toast.error("Không nhận được link thanh toán từ PayOS");
                console.error("Payment response:", paymentResponse.data);
            }
        } catch (error: any) {
            toast.error(
                error.response?.data?.message ||
                error.message ||
                "Mua gói thất bại. Vui lòng thử lại."
            );
        } finally {
            setPurchaseLoading(null);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-screen">
                Đang tải bảng giá...
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 md:p-12">
            <Helmet>
                <title>Nâng cấp Gói Dịch Vụ || Condotel Management</title>
            </Helmet>
            <h1 className="text-3xl font-bold text-center mb-4">
                Bảng giá Dịch vụ
            </h1>
            <p className="text-center text-gray-600 mb-12">
                Chọn gói phù hợp để bắt đầu đăng tin cho thuê condotel của bạn.
            </p>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {packages.map((pkg) => (
                    <div key={pkg.packageId} className="border rounded-lg p-6 shadow-lg flex flex-col bg-white dark:bg-neutral-800">
                        {/* Ten Goi */}
                        <h2 className="text-2xl font-semibold mb-4 text-blue-600">{pkg.name}</h2>

                        {/* Gia Tien */}
                        <p className="text-4xl font-bold mb-4">
                            {pkg.price.toLocaleString("vi-VN")}
                            <span className="text-lg font-normal text-gray-500"> VNĐ</span>
                        </p>

                        {/* Thoi han */}
                        <p className="text-gray-500 mb-6 font-medium">Thời hạn: {pkg.duration} Ngày</p>
                        <p className="text-gray-700 dark:text-gray-300 mb-6">{pkg.description} Ngày</p>

                        {/* Quyen loi */}
                        <ul className="space-y-3 mb-8 text-sm flex-grow">
                            <li className="flex items-center">
                                <span className="text-green-500 mr-2">✔</span>
                                Đăng tối đa  <b> {pkg.maxListings}</b> căn hộ.
                            </li>
                            <li className="flex items-center">
                                <span className={pkg.canUseFeaturedListing ? "text-green-500 mr-2" : "text-red-500 mr-2"}>
                                    {pkg.canUseFeaturedListing ? "✔" : "✘"}
                                </span>
                                {pkg.canUseFeaturedListing ? "Được đăng tin nổi bật" : "Không hỗ trợ tin nổi bật"}
                            </li>
                            {/* Them cac quyen loi khac o day */}
                        </ul>

                        <ButtonPrimary
                            onClick={() => handlePurchase(pkg)}
                            disabled={purchaseLoading === pkg.packageId}
                            className="mt-auto w-full"
                        >
                            {purchaseLoading === pkg.packageId ? "Đang xử lý..." : "Chọn gói này"}
                        </ButtonPrimary>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PricingPage;