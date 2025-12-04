import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, HostRegisterRequest } from 'api/auth';
import { useAuth } from 'contexts/AuthContext';
import { toast } from 'react-toastify';
import Input from 'shared/Input/Input';
import ButtonPrimary from 'shared/Button/ButtonPrimary';
import { Helmet } from 'react-helmet';

const BecomeAHostPage: React.FC = () => {
    const navigate = useNavigate();
    const { reloadUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState<HostRegisterRequest>({
        PhoneContact: "",
        Address: "",
        CompanyName: "",
        BankName: "",
        AccountNumber: "",
        AccountHolderName: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.PhoneContact?.trim() ||
            !formData.BankName?.trim() ||
            !formData.AccountNumber?.trim() ||
            !formData.AccountHolderName?.trim()) {
            setError("Vui lòng điền đầy đủ các trường có dấu (*).");
            setLoading(false);
            return;
        }

        try {
            const response = await authAPI.registerAsHost(formData);
            toast.success(response.message || "Đăng ký Host thành công! Chuyển sang chọn gói dịch vụ...");

            await reloadUser();
            navigate("/pricing");
        } catch (err: any) {
            let errorMessage = err.response?.data?.message || "Đã xảy ra lỗi khi đăng ký.";

            if (err.response?.status === 400 && err.response.data?.errors) {
                const errors = err.response.data.errors;
                const list = Object.values(errors).flat().join("\n");
                errorMessage = list || errorMessage;
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Helmet>
                <title>Trở thành Chủ nhà • Condotel.fis</title>
            </Helmet>

            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
                <div className="max-w-2xl mx-auto">
                    {/* Header đẹp như Airbnb */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-lg">
                            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
                            Trở thành Chủ nhà Condotel
                        </h1>
                        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-lg mx-auto">
                            Kiếm tiền bằng cách cho thuê condotel của bạn – chỉ cần vài bước!
                        </p>
                    </div>

                    {/* Form Card đẹp */}
                    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700">
                        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-1">
                            <div className="bg-white dark:bg-gray-800 px-8 pt-10 pb-8">
                                <form onSubmit={handleSubmit} className="space-y-7">
                                    {/* Thông tin liên hệ */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 text-sm font-bold">1</span>
                                            Thông tin liên hệ
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <Input
                                                label="Số điện thoại liên hệ"
                                                name="PhoneContact"
                                                value={formData.PhoneContact}
                                                onChange={handleChange}
                                                placeholder="0912 345 678"
                                                required
                                            />
                                            <Input
                                                label="Địa chỉ (Tùy chọn)"
                                                name="Address"
                                                value={formData.Address}
                                                onChange={handleChange}
                                                placeholder="123 Đường Láng, Đống Đa, Hà Nội"
                                            />
                                        </div>
                                    </div>

                                    <hr className="border-gray-200 dark:border-gray-700" />

                                    {/* Thông tin ngân hàng */}
                                    <div className="space-y-6">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <span className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-300 text-sm font-bold">2</span>
                                            Thông tin nhận thanh toán
                                        </h3>
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <Input
                                                label="Tên ngân hàng"
                                                name="BankName"
                                                value={formData.BankName}
                                                onChange={handleChange}
                                                placeholder="Vietcombank, Techcombank, BIDV..."
                                                required
                                            />
                                            <Input
                                                label="Số tài khoản"
                                                name="AccountNumber"
                                                value={formData.AccountNumber}
                                                onChange={handleChange}
                                                placeholder="0123456789"
                                                required
                                            />
                                        </div>
                                        <Input
                                            label="Chủ tài khoản"
                                            name="AccountHolderName"
                                            value={formData.AccountHolderName}
                                            onChange={handleChange}
                                            placeholder="NGUYỄN VĂN A (viết hoa, không dấu)"
                                            required
                                        />
                                        <Input
                                            label="Tên công ty (Tùy chọn)"
                                            name="CompanyName"
                                            value={formData.CompanyName}
                                            onChange={handleChange}
                                            placeholder="Công ty TNHH Du lịch ABC"
                                        />
                                    </div>

                                    {/* Lỗi */}
                                    {error && (
                                        <div className="p-5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl text-red-700 dark:text-red-300 text-sm whitespace-pre-line">
                                            {error}
                                        </div>
                                    )}

                                    {/* Nút submit */}
                                    <div className="pt-6">
                                        <ButtonPrimary
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-5 text-lg font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300"
                                        >
                                            {loading ? (
                                                <span className="flex items-center justify-center gap-3">
                                                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                                    </svg>
                                                    Đang xử lý...
                                                </span>
                                            ) : (
                                                "Hoàn tất & Chọn gói dịch vụ"
                                            )}
                                        </ButtonPrimary>

                                        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                                            Sau khi hoàn tất, bạn sẽ được chuyển đến trang chọn gói dịch vụ
                                        </p>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Footer nhỏ */}
                    <div className="text-center mt-12 text-gray-500 dark:text-gray-400 text-sm">
                        <p>Bạn cần hỗ trợ? Liên hệ <a href="/chat" className="text-blue-600 hover:underline font-medium">Hỗ trợ 24/7</a></p>
                    </div>
                </div>
            </div>
        </>
    );
};

export default BecomeAHostPage;