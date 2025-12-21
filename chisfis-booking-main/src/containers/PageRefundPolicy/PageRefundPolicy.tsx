import React from "react";
import { Link } from "react-router-dom";

const PageRefundPolicy = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      {/* --- Header Banner --- */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-4">
            <Link to="/" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Trang chủ
            </Link>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
            Chính sách Hủy phòng & Hoàn tiền
          </h1>
        </div>
      </div>

      {/* --- Nội dung chính --- */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm space-y-10">
          
          {/* 1. Tổng quan */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Tổng quan</h2>
            <p className="text-gray-600 leading-relaxed">
              Tại <strong>Condotel Rental</strong>, chúng tôi hiểu rằng kế hoạch của bạn có thể thay đổi. 
              Chính sách này được thiết lập để đảm bảo quyền lợi công bằng cho cả Khách hàng (Tenant) 
              và Chủ nhà (Host). Vui lòng đọc kỹ các điều khoản dưới đây trước khi thực hiện đặt phòng.
            </p>
          </section>

          {/* 2. Quy định Hủy phòng & Mức hoàn tiền */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Quy định hoàn tiền</h2>
            <p className="text-gray-600 mb-4">
              Số tiền hoàn lại sẽ phụ thuộc vào thời điểm bạn gửi yêu cầu hủy phòng so với ngày nhận phòng (Check-in) dự kiến.
            </p>
            
            {/* Bảng quy định */}
            <div className="overflow-hidden border border-gray-200 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thời điểm hủy</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mức hoàn tiền</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Trước 7 ngày</td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">Hoàn 100% chi phí</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Từ 4 đến 6 ngày</td>
                    <td className="px-6 py-4 text-sm font-bold text-yellow-600">Hoàn 50% chi phí</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Dưới 4 ngày (Sát ngày đi)</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">Không hoàn tiền</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-sm text-gray-500 mt-2 italic">
              * Chi phí dịch vụ (nếu có) sẽ không được hoàn lại trong mọi trường hợp.
            </p>
          </section>

          {/* 3. Quy trình hoàn tiền */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Quy trình nhận tiền hoàn</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>
                Khi hủy phòng, hệ thống sẽ yêu cầu bạn cung cấp <strong>Thông tin tài khoản ngân hàng</strong> (Tên ngân hàng, Số tài khoản, Tên chủ thẻ).
              </li>
              <li>
                Yêu cầu hoàn tiền của bạn sẽ được Admin kiểm duyệt.
              </li>
              <li>
                Thời gian xử lý hoàn tiền là từ <strong>1 - 3 ngày làm việc</strong> (không tính Thứ 7, Chủ Nhật và Lễ Tết).
              </li>
              <li>
                Tiền sẽ được chuyển khoản trực tiếp từ tài khoản của hệ thống Condotel về tài khoản ngân hàng bạn đã cung cấp.
              </li>
            </ul>
          </section>

          {/* 4. Trường hợp bất khả kháng */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Trường hợp bất khả kháng</h2>
            <p className="text-gray-600 leading-relaxed">
              Trong các trường hợp đặc biệt như thiên tai, dịch bệnh, hoặc các quy định cấm đi lại của chính phủ, 
              chính sách hoàn tiền có thể được xem xét linh hoạt hơn (ví dụ: bảo lưu tiền cọc hoặc hoàn 100%). 
              Vui lòng liên hệ trực tiếp với bộ phận Hỗ trợ để được giải quyết.
            </p>
          </section>

          {/* 5. Liên hệ */}
          <section className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Cần hỗ trợ thêm?</h2>
            <p className="text-blue-800 mb-4">
              Nếu bạn có bất kỳ câu hỏi nào về đơn đặt phòng của mình, đừng ngần ngại liên hệ với chúng tôi.
            </p>
            <div className="flex gap-4">
              <Link to="/contact" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Liên hệ ngay
              </Link>
              <a href="tel:1900xxxx" className="px-4 py-2 bg-white text-blue-600 border border-blue-200 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                Hotline: 1900 xxxx
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PageRefundPolicy;