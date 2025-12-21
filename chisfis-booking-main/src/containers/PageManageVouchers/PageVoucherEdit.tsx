import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ConfirmModal from "components/ConfirmModal";

// Component con Sidebar
const SidebarCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="bg-white p-5 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold border-b border-gray-200 pb-3 mb-4">{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const PageVoucherEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // State (giống hệt trang Add)
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"percentage" | "amount">("percentage");
  const [discountValue, setDiscountValue] = useState(0);
  const [condotelId, setCondotelId] = useState("all");
  const [usageLimit, setUsageLimit] = useState(100);
  const [usedCount, setUsedCount] = useState(0); // <-- Thêm
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [status, setStatus] = useState("Active");
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Tải dữ liệu giả lập
  useEffect(() => {
    // TODO: Gọi API lấy chi tiết voucher với `id`
    // Dữ liệu giả lập
    setCode("SALE30");
    setDiscountType("percentage");
    setDiscountValue(30);
    setCondotelId("all");
    setUsageLimit(100);
    setUsedCount(15);
    setStartDate("2025-11-10");
    setEndDate("2025-11-20");
    setStatus("Active");
  }, [id]);

  const toastSuccess = (msg: string) => alert(msg);

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // TODO: Gọi API cập nhật
    setTimeout(() => {
      setIsLoading(false);
      toastSuccess("Cập nhật voucher thành công!");
      navigate("/manage-vouchers");
    }, 1000);
  };
  
  const handleDelete = () => {
    setShowConfirmModal(true);
  };

  const confirmDelete = () => {
    setShowConfirmModal(false);
    setIsLoading(true);
    // TODO: Gọi API xóa
    setTimeout(() => {
      setIsLoading(false);
      alert("Đã xóa voucher.");
      navigate("/manage-vouchers");
    }, 1000);
  };


  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <form onSubmit={handleUpdate}>
        <div className="mb-4">
          <Link to="/manage-vouchers" className="text-sm text-blue-600 hover:underline">
            &larr; Quay lại danh sách
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* --- CỘT TRÁI (NỘI DUNG CHÍNH) --- */}
          <div className="md:col-span-8 lg:col-span-9 space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Mã Voucher
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Ví dụ: SALE30"
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </div>
          </div>

          {/* --- CỘT PHẢI (SIDEBAR) --- */}
          <div className="md:col-span-4 lg:col-span-3 space-y-6">
            
            {/* Box Hành động (ĐÃ SỬA) */}
            <SidebarCard title="Hành động">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isLoading ? "Đang cập nhật..." : "Cập nhật Voucher"}
              </button>
              <button
                type="button"
                disabled={isLoading}
                onClick={handleDelete}
                className="w-full px-4 py-2 bg-white text-red-600 border border-red-500 rounded-md hover:bg-red-50 disabled:bg-gray-100"
              >
                Xóa Voucher
              </button>
            </SidebarCard>

            <SidebarCard title="Loại giảm giá">
              <div className="flex gap-4">
                <div className="flex items-center">
                  <input id="type_percentage" type="radio" value="percentage" name="discountType"
                    checked={discountType === "percentage"}
                    onChange={() => setDiscountType("percentage")}
                  />
                  <label htmlFor="type_percentage" className="ml-2 text-sm">Phần trăm (%)</label>
                </div>
                <div className="flex items-center">
                  <input id="type_amount" type="radio" value="amount" name="discountType"
                    checked={discountType === "amount"}
                    onChange={() => setDiscountType("amount")}
                  />
                  <label htmlFor="type_amount" className="ml-2 text-sm">Số tiền cố định (VNĐ)</label>
                </div>
              </div>
              <div>
                <label htmlFor="value" className="block text-sm font-medium text-gray-700 mb-1">
                  Giá trị
                </label>
                <input
                  type="number"
                  id="value"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </SidebarCard>

            <SidebarCard title="Cài đặt">
              <label htmlFor="condotel" className="block text-sm font-medium text-gray-700 mb-1">
                Áp dụng cho
              </label>
              <select id="condotel" value={condotelId} onChange={(e) => setCondotelId(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-white"
              >
                <option value="all">Tất cả Condotel</option>
                <option value="1">Mường Thanh Vũng Tàu</option>
                <option value="2">Vinpearl Nha Trang</option>
              </select>

              <label htmlFor="usageLimit" className="block text-sm font-medium text-gray-700 mb-1">
                Giới hạn sử dụng
              </label>
              <input type="number" id="usageLimit" value={usageLimit}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-sm text-gray-600">
                Đã dùng: <span className="font-medium">{usedCount} / {usageLimit}</span>
              </p>
            </SidebarCard>
            
            <SidebarCard title="Thời gian hiệu lực">
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày bắt đầu
              </label>
              <input type="date" id="startDate" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
              
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                Ngày kết thúc
              </label>
              <input type="date" id="endDate" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                required
              />
            </SidebarCard>

          </div>
        </div>
      </form>
    </div>
  );
};

export default PageVoucherEdit;