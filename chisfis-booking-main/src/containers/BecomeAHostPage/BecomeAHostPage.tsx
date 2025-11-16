import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, HostRegisterRequest } from 'api/auth'; // Đảm bảo đã import HostRegisterRequest
import { useAuth } from 'contexts/AuthContext';
import { toast } from 'react-toastify';
import Input from 'shared/Input/Input';
import ButtonPrimary from 'shared/Button/ButtonPrimary';

const BecomeAHostPage: React.FC = () => {
    const navigate = useNavigate();
    const { reloadUser } = useAuth(); // Lấy hàm reload từ Context
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    // SỬA 1: Dùng PascalCase cho state (để khớp DTO)
    const [formData, setFormData] = useState<HostRegisterRequest>({
        PhoneContact: "",
        Address: "",
        CompanyName: "",
        BankName: "",
        AccountNumber: "",
        AccountHolderName: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // name (PascalCase) sẽ khớp với state
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        // SỬA 2: Kiểm tra state bằng PascalCase
        if (!formData.PhoneContact || !formData.BankName || !formData.AccountNumber || !formData.AccountHolderName) {
            setError("Vui lòng điền các trường bắt buộc (*).");
            setLoading(false);
            return;
        }

        console.log("Dữ liệu gửi đi (PascalCase):", formData);

        try {
            // formData (PascalCase) giờ đã khớp với DTO (PascalCase)
            const response = await authAPI.registerAsHost(formData);
            toast.success(response.message || "Đăng ký Host thành công! Vui lòng chọn gói dịch vụ.");

            await reloadUser();

            navigate("/pricing"); // Chuyển hướng đến trang chọn gói

        } catch (err: any) {
            let errorMessage = err.response?.data?.message || "Đã xảy ra lỗi khi đăng ký.";

            // (Code xử lý lỗi 400 validation của bạn)
            if (err.response?.status === 400) {
                const validationErrors = err.response.data?.errors;
                if (validationErrors) {
                    let errorList: string[] = [];
                    Object.keys(validationErrors).forEach(key => {
                        errorList = errorList.concat(validationErrors[key]);
                    });
                    if (errorList.length > 0) {
                        errorMessage = "Lỗi Validation: " + errorList.join(" | ");
                    }
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container max-w-2xl mx-auto my-12 p-8">
            <h1 className="text-3xl font-bold mb-8">Trở thành Chủ nhà (Host)</h1>
            <p className="mb-6">Cung cấp thông tin bổ sung để chúng tôi có thể setup tài khoản Host cho bạn.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* SỬA 3: Đổi 'name' sang PascalCase */}
                <Input
                    label="Số điện thoại liên hệ (*)"
                    name="PhoneContact"
                    value={formData.PhoneContact}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Địa chỉ"
                    name="Address"
                    value={formData.Address}
                    onChange={handleChange}
                />
                <Input
                    label="Tên ngân hàng (*)"
                    name="BankName"
                    value={formData.BankName}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Số tài khoản (*)"
                    name="AccountNumber"
                    value={formData.AccountNumber}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Tên chủ tài khoản (*)"
                    name="AccountHolderName"
                    value={formData.AccountHolderName}
                    onChange={handleChange}
                    required
                />
                <Input
                    label="Tên công ty (Tùy chọn)"
                    name="CompanyName"
                    value={formData.CompanyName}
                    onChange={handleChange}
                />

                {error && <p className="text-red-500">{error}</p>}

                <ButtonPrimary type="submit" disabled={loading}>
                    {loading ? "Đang xử lý..." : "Hoàn tất Đăng ký Host"}
                </ButtonPrimary>
            </form>
        </div>
    );
};

export default BecomeAHostPage;