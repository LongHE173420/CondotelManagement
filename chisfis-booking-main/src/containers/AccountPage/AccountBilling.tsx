import React, { useState } from "react";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import Input from "shared/Input/Input";
import Label from "components/Label/Label";
import CommonLayout from "./CommonLayout";

const AccountBilling = () => {
  const [formData, setFormData] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    bankCode: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    setLoading(true);

    try {
      // Gọi API save billing info
      // await saveBillingInfo(formData);
      setMessage("Cập nhật thông tin thanh toán thành công!");
    } catch (err: any) {
      setError("Không thể cập nhật thông tin!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <CommonLayout>
        <div className="space-y-6 sm:space-y-8">
          {/* HEADING */}
          <h2 className="text-3xl font-semibold">Thông tin thanh toán</h2>
          <div className="w-14 border-b border-neutral-200 dark:border-neutral-700"></div>

          <form className="max-w-2xl space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <Label>Tên ngân hàng</Label>
                <Input
                  className="mt-1.5"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  placeholder="Vietcombank, ACB, ..."
                />
              </div>
              <div>
                <Label>Số tài khoản</Label>
                <Input
                  className="mt-1.5"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="1234567890"
                  type="number"
                />
              </div>
              <div>
                <Label>Tên chủ tài khoản</Label>
                <Input
                  className="mt-1.5"
                  name="accountHolder"
                  value={formData.accountHolder}
                  onChange={handleChange}
                  placeholder="NGUYEN VAN A"
                />
              </div>
              <div>
                <Label>Mã ngân hàng</Label>
                <Input
                  className="mt-1.5"
                  name="bankCode"
                  value={formData.bankCode}
                  onChange={handleChange}
                  placeholder="970422"
                />
              </div>
            </div>

            {message && (
              <div className="p-4 bg-green-100 text-green-800 rounded-lg text-sm">
                {message}
              </div>
            )}
            {error && (
              <div className="p-4 bg-red-100 text-red-800 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="pt-4">
              <ButtonPrimary type="submit" disabled={loading}>
                {loading ? "Đang lưu..." : "Lưu thông tin"}
              </ButtonPrimary>
            </div>
          </form>

          <div className="max-w-2xl mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-700">
            <h3 className="text-lg font-semibold mb-4">Lưu ý</h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Thông tin thanh toán được bảo mật và chỉ sử dụng cho mục đích trả tiền.
              Thanh toán được xử lý sau khi khách check-in.
            </p>
          </div>
        </div>
      </CommonLayout>
    </div>
  );
};

export default AccountBilling;
