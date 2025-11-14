import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, HostRegisterRequest } from 'api/auth';
import { useAuth } from 'contexts/AuthContext';
import { toast } from 'react-toastify';
import Input from 'shared/Input/Input';
import ButtonPrimary from 'shared/Button/ButtonPrimary';

const BecomeAHostPage: React.FC = () => {
    const navigate = useNavigate();
    const { reloadUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // Dùng PascalCase để khớp với DTO Backend (.NET)
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

        // Validation bắt buộc
        if (!formData.PhoneContact?.trim() ||
            !formData.BankName?.trim() ||
            !formData.AccountNumber?.trim() ||
            !formData.AccountHolderName?.trim()) {
            setError("Vui lòng điền đầy đủ các trường bắt buộc (*).");
            setLoading(false);
            return;
        }

        console.log("Dữ liệu gửi đi (PascalCase):", formData);

        try {
            const response = await authAPI.registerAsHost(formData);

            toast.success(response.message || "Đăng ký Host thành công! Vui lòng chọn gói dịch vụ.");

            // Cập nhật lại thông tin user trong context
            await reloadUser();

            // Chuyển hướng đến trang chọn gói
            navigate("/pricing");
        } catch (err: any) {
            let errorMessage = err.response?.data?.message || "Đã xảy ra lỗi khi đăng ký.";

            // Xử lý lỗi validation 400 từ .NET
            if (err.response?.status === 400) {
                const validationErrors = err.response.data?.errors;
                if (validationErrors && typeof validationErrors === 'object') {
                    const errorList: string[] = [];
                    Object.keys(validationErrors).forEach(key => {
                        const messages = validationErrors[key];
                        if (Array.isArray(messages)) {
                            errorList.push(...messages);
                        } else if (typeof messages === 'string') {
                            errorList.push(messages);
                        }
                    });
                    if (errorList.length > 0) {
                        errorMessage = "Lỗi validation:\n" + errorList.join("\n");
                    }
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto my-12 p-8 bg-white rounded-lg shadow-md">
            <h1 className="text-3xl font-bold mb-8 text-center">Trở thành Chủ nhà (Host)</h1>
            <p className="mb-8 text-gray-600 text-center">
                Cung cấp thông tin bổ sung để chúng tôi setup tài khoản Host cho bạn.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <Input
                    label="Số điện thoại liên hệ (*)"
                    name="PhoneContact"
                    value={formData.PhoneContact}
                    onChange={handleChange}
                    placeholder="0123456789"
                    required
                />

                <Input
                    label="Địa chỉ"
                    name="Address"
                    value={formData.Address}
                    onChange={handleChange}
                    placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/thành"
                />

                <Input
                    label="Tên ngân hàng (*)"
                    name="BankName"
                    value={formData.BankName}
                    onChange={handleChange}
                    placeholder="Ví dụ: Vietcombank, Techcombank..."
                    required
                />

                <Input
                    label="Số tài khoản (*)"
                    name="AccountNumber"
                    value={formData.AccountNumber}
                    onChange={handleChange}
                    placeholder="1234567890"
                    required
                />

                <Input
                    label="Tên chủ tài khoản (*)"
                    name="AccountHolderName"
                    value={formData.AccountHolderName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                    required
                />

                <Input
                    label="Tên công ty (Tùy chọn)"
                    name="CompanyName"
                    value={formData.CompanyName}
                    onChange={handleChange}
                    placeholder="Công ty TNHH ABC"
                />

                {/* Hiển thị lỗi */}
                {error && (
                    <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg text-sm whitespace-pre-line">
                        {error}
                    </div>
                )}

                {/* Nút submit */}
                <div className="pt-4">
                    <ButtonPrimary
                        type="submit"
                        disabled={loading}
                        className="w-full"
                    >
                        {loading ? "Đang xử lý..." : "Hoàn tất Đăng ký Host"}
                    </ButtonPrimary>
                </div>
            </form>
        </div>
    );
};

export default BecomeAHostPage;