import React, { useEffect, useRef, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axiosClient from "api/axiosClient";
import { toast } from "react-toastify";

const PaymentSuccess: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const hasCalledAPI = useRef(false);
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

    useEffect(() => {
        const orderCode = searchParams.get("orderCode");
        const type = searchParams.get("type");

        if (!orderCode) {
            navigate("/");
            return;
        }

        if (type === "package") {
            if (hasCalledAPI.current) return;
            hasCalledAPI.current = true;

            console.log("Gọi API confirm-payment với OrderCode:", orderCode);

            axiosClient
                .get(`/Package/confirm-payment?orderCode=${orderCode}`)
                .then((res) => {
                    console.log("API thành công:", res.data); // ← res.data mới chứa message
                    setStatus('success');

                    // ← SỬA 2 DÒNG DUY NHẤT TẠI ĐÂY
                    const message = (res.data as any)?.message || "THANH TOÁN THÀNH CÔNG! BẠN ĐÃ LÊN HOST!";
                    toast.success(message);

                    setTimeout(() => {
                        navigate("/host-dashboard");
                    }, 3000);
                })
                .catch((err) => {
                    console.error("Lỗi API confirm-payment:", err.response?.data || err);
                    setStatus('error');
                    toast.warning("Giao dịch đã hoàn tất, đang cập nhật quyền Host...");

                    setTimeout(() => {
                        navigate("/host-dashboard");
                    }, 4000);
                });
        } else {
            navigate("/");
        }
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-400 to-blue-600">
            <div className="text-center p-12 bg-white rounded-3xl shadow-3xl max-w-md w-full">
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-20 w-20 border-t-8 border-b-8 border-blue-600 mx-auto mb-8"></div>
                        <h1 className="text-3xl font-bold text-blue-700 mb-4">
                            ĐANG KÍCH HOẠT QUYỀN HOST...
                        </h1>
                        <p className="text-gray-600 text-lg">
                            Vui lòng đợi 5 giây, hệ thống đang nâng cấp tài khoản của bạn!
                        </p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                            </svg>
                        </div>
                        <h1 className="text-4xl font-bold text-green-600 mb-4">
                            BẠN ĐÃ LÊN HOST!
                        </h1>
                        <p className="text-gray-700 text-xl mb-6">
                            Chúc mừng! Bạn có thể đăng tin Condotel ngay bây giờ!
                        </p>
                        <div className="text-6xl animate-bounce">Party</div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="mx-auto w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mb-6">
                            <svg className="w-16 h-16 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 8v4m0 4h.01"></path>
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-yellow-700 mb-4">
                            Đang xử lý...
                        </h1>
                        <p className="text-gray-700">
                            Thanh toán thành công! Quyền Host sẽ được cập nhật trong giây lát.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default PaymentSuccess;