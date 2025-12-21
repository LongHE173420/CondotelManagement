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
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [formData, setFormData] = useState<HostRegisterRequest>({
        PhoneContact: "",
        Address: "",
        CompanyName: "",
        BankName: "",
        AccountNumber: "",
        AccountHolderName: "",
    });
    const validateField = (name: string, value: string): string => {
        switch (name) {
            case "PhoneContact":
                const cleanPhone = value.replace(/\s/g, '');
                if (!cleanPhone) return "Số điện thoại là bắt buộc";
                if (!/^[0-9]{10}$/.test(cleanPhone)) return "Số điện thoại phải là 10 chữ số";
                return "";

            case "BankName":
                if (!value.trim()) return "Tên ngân hàng là bắt buộc";
                if (value.length > 100) return "Tên ngân hàng tối đa 100 ký tự";
                return "";

            case "AccountNumber":
                const cleanAccount = value.replace(/\s/g, '');
                if (!cleanAccount) return "Số tài khoản là bắt buộc";
                if (!/^[0-9]+$/.test(cleanAccount)) return "Số tài khoản chỉ được chứa số";
                if (cleanAccount.length > 50) return "Số tài khoản tối đa 50 ký tự";
                return "";

            case "AccountHolderName":
                if (!value.trim()) return "Tên chủ tài khoản là bắt buộc";
                if (value.length > 100) return "Tên chủ tài khoản tối đa 100 ký tự";
                return "";

            case "Address":
                if (value && value.length > 500) return "Địa chỉ tối đa 500 ký tự";
                return "";

            case "CompanyName":
                if (value && value.length > 200) return "Tên công ty tối đa 200 ký tự";
                return "";

            default:
                return "";
        }
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;

        // Xử lý format số điện thoại
        if (name === "PhoneContact") {
            // Chỉ cho phép số và khoảng trắng
            const numericValue = value.replace(/[^\d\s]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        // Xử lý format số tài khoản
        if (name === "AccountNumber") {
            // Chỉ cho phép số và khoảng trắng
            const numericValue = value.replace(/[^\d\s]/g, '');
            setFormData(prev => ({ ...prev, [name]: numericValue }));
            return;
        }

        // Xử lý tên chủ tài khoản (viết hoa không dấu)
        if (name === "AccountHolderName") {
            const upperValue = value.toUpperCase();
            // Loại bỏ dấu tiếng Việt
            const noAccentValue = upperValue
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^A-Z\s]/g, '');
            setFormData(prev => ({ ...prev, [name]: noAccentValue }));
            return;
        }

        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // Client-side validation chi tiết hơn
        const errors: string[] = [];

        // Kiểm tra từng trường bắt buộc
        if (!formData.PhoneContact?.trim()) {
            errors.push("Số điện thoại là bắt buộc");
        } else {
            const phoneRegex = /^[0-9]{10,20}$/;
            const cleanPhone = formData.PhoneContact.replace(/\s/g, '');
            if (!phoneRegex.test(cleanPhone)) {
                errors.push("Số điện thoại phải là 10-20 chữ số");
            }
        }

        if (!formData.BankName?.trim()) {
            errors.push("Tên ngân hàng là bắt buộc");
        } else if (formData.BankName.length > 100) {
            errors.push("Tên ngân hàng tối đa 100 ký tự");
        }

        if (!formData.AccountNumber?.trim()) {
            errors.push("Số tài khoản là bắt buộc");
        } else {
            const accountRegex = /^[0-9]+$/;
            const cleanAccount = formData.AccountNumber.replace(/\s/g, '');
            if (!accountRegex.test(cleanAccount)) {
                errors.push("Số tài khoản chỉ được chứa số");
            } else if (cleanAccount.length > 50) {
                errors.push("Số tài khoản tối đa 50 ký tự");
            }
        }

        if (!formData.AccountHolderName?.trim()) {
            errors.push("Tên chủ tài khoản là bắt buộc");
        } else if (formData.AccountHolderName.length > 100) {
            errors.push("Tên chủ tài khoản tối đa 100 ký tự");
        }

        // Kiểm tra các trường tùy chọn
        if (formData.Address && formData.Address.length > 500) {
            errors.push("Địa chỉ tối đa 500 ký tự");
        }

        if (formData.CompanyName && formData.CompanyName.length > 200) {
            errors.push("Tên công ty tối đa 200 ký tự");
        }

        // Hiển thị lỗi nếu có
        if (errors.length > 0) {
            setError(errors.join("\n"));
            setLoading(false);
            return;
        }

        try {
            // Format dữ liệu trước khi gửi
            const payload = {
                ...formData,
                PhoneContact: formData.PhoneContact.replace(/\s/g, ''),
                AccountNumber: formData.AccountNumber.replace(/\s/g, ''),
                // Xử lý optional fields
                Address: formData.Address?.trim() || undefined,
                CompanyName: formData.CompanyName?.trim() || undefined,
            };

            const response = await authAPI.registerAsHost(payload);

            toast.success(response.message || "Đăng ký Host thành công! Chuyển sang chọn gói dịch vụ...");

            await reloadUser();
            navigate("/pricing");
        } catch (err: any) {
            let errorMessage = "Đã xảy ra lỗi khi đăng ký.";
            let validationErrors: string[] = [];

            if (err.response?.status === 400) {
                // Xử lý lỗi validation từ backend (ModelState)
                if (err.response.data?.errors) {
                    const errors = err.response.data.errors;

                    // Chuyển đổi object errors thành array
                    Object.values(errors).forEach((errorArray: any) => {
                        if (Array.isArray(errorArray)) {
                            validationErrors.push(...errorArray);
                        } else {
                            validationErrors.push(errorArray);
                        }
                    });

                    if (validationErrors.length > 0) {
                        errorMessage = validationErrors.join("\n");
                    }
                }
                // Hiển thị message đơn giản
                else if (err.response.data?.message) {
                    errorMessage = err.response.data.message;
                }
            }
            else if (err.response?.status === 401) {
                errorMessage = "Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.";
                toast.error(errorMessage);
                setTimeout(() => navigate("/login"), 2000);
                setLoading(false);
                return;
            }
            else if (err.response?.status === 500) {
                errorMessage = "Lỗi hệ thống. Vui lòng thử lại sau.";
            }

            setError(errorMessage);
            toast.error(errorMessage);
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