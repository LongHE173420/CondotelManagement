import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const PageTerms = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Helmet>
        <title>Điều khoản sử dụng || Fiscondotel</title>
      </Helmet>

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
            Điều khoản sử dụng
          </h1>
          <p className="text-gray-600 mt-2">Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}</p>
        </div>
      </div>

      {/* --- Nội dung chính --- */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm space-y-10">
          
          {/* 1. Giới thiệu */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Giới thiệu</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Chào mừng bạn đến với <strong>Fiscondotel</strong> - nền tảng đặt phòng condotel hàng đầu tại Việt Nam. 
              Bằng việc truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu trong tài liệu này.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Nếu bạn không đồng ý với bất kỳ phần nào của các điều khoản này, vui lòng không sử dụng dịch vụ của chúng tôi.
            </p>
          </section>

          {/* 2. Định nghĩa */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Định nghĩa</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li><strong>"Chúng tôi", "Fiscondotel", "Nền tảng"</strong>: Chỉ công ty vận hành website và dịch vụ đặt phòng condotel.</li>
              <li><strong>"Bạn", "Người dùng", "Khách hàng"</strong>: Chỉ bất kỳ cá nhân hoặc tổ chức nào truy cập và sử dụng dịch vụ của chúng tôi.</li>
              <li><strong>"Host", "Chủ nhà"</strong>: Chỉ người sở hữu hoặc quản lý condotel đăng ký trên nền tảng.</li>
              <li><strong>"Tenant", "Khách thuê"</strong>: Chỉ người đặt phòng và sử dụng dịch vụ condotel.</li>
              <li><strong>"Condotel"</strong>: Chỉ căn hộ condotel được đăng ký và quản lý trên nền tảng.</li>
              <li><strong>"Booking", "Đặt phòng"</strong>: Chỉ giao dịch đặt phòng condotel thông qua nền tảng.</li>
            </ul>
          </section>

          {/* 3. Điều kiện sử dụng */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Điều kiện sử dụng</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3.1. Độ tuổi</h3>
                <p>Bạn phải đủ 18 tuổi trở lên để sử dụng dịch vụ của chúng tôi. Nếu bạn dưới 18 tuổi, bạn phải có sự đồng ý của người giám hộ hợp pháp.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3.2. Tài khoản</h3>
                <p>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập của mình. Bạn không được chia sẻ thông tin đăng nhập với bất kỳ ai và phải thông báo ngay cho chúng tôi nếu phát hiện vi phạm bảo mật.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3.3. Thông tin chính xác</h3>
                <p>Bạn cam kết cung cấp thông tin chính xác, đầy đủ và cập nhật khi đăng ký tài khoản và đặt phòng. Chúng tôi có quyền từ chối hoặc hủy đặt phòng nếu phát hiện thông tin không chính xác.</p>
              </div>
            </div>
          </section>

          {/* 4. Quyền và nghĩa vụ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Quyền và nghĩa vụ của người dùng</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4.1. Quyền của bạn</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Truy cập và sử dụng dịch vụ đặt phòng condotel</li>
                  <li>Xem thông tin chi tiết về condotel, giá cả, và đánh giá</li>
                  <li>Đặt phòng và thanh toán an toàn</li>
                  <li>Đánh giá và phản hồi về trải nghiệm của bạn</li>
                  <li>Yêu cầu hủy phòng và hoàn tiền theo chính sách</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4.2. Nghĩa vụ của bạn</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tuân thủ các quy định pháp luật hiện hành</li>
                  <li>Sử dụng dịch vụ một cách hợp pháp và đúng mục đích</li>
                  <li>Không sử dụng dịch vụ để thực hiện các hoạt động bất hợp pháp</li>
                  <li>Tôn trọng quyền sở hữu trí tuệ của chúng tôi và bên thứ ba</li>
                  <li>Không can thiệp hoặc làm gián đoạn hoạt động của hệ thống</li>
                  <li>Thanh toán đầy đủ và đúng hạn các khoản phí phát sinh</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Đặt phòng và thanh toán */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Đặt phòng và thanh toán</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">5.1. Quy trình đặt phòng</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Bạn có thể tìm kiếm và xem thông tin condotel trên nền tảng</li>
                  <li>Chọn ngày check-in, check-out và số lượng khách</li>
                  <li>Xác nhận thông tin và tiến hành thanh toán</li>
                  <li>Nhận xác nhận đặt phòng qua email</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">5.2. Thanh toán</h3>
                <p>Chúng tôi chấp nhận thanh toán qua các phương thức: thẻ tín dụng, thẻ ghi nợ, ví điện tử, và chuyển khoản ngân hàng. Tất cả giao dịch được xử lý an toàn thông qua các đối tác thanh toán được ủy quyền.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">5.3. Giá cả</h3>
                <p>Giá cả hiển thị trên nền tảng đã bao gồm thuế VAT (nếu có). Giá có thể thay đổi tùy theo thời điểm đặt phòng, khuyến mãi, và các yếu tố khác. Giá cuối cùng sẽ được hiển thị rõ ràng trước khi bạn xác nhận đặt phòng.</p>
              </div>
            </div>
          </section>

          {/* 6. Hủy phòng và hoàn tiền */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Hủy phòng và hoàn tiền</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Chính sách hủy phòng và hoàn tiền được quy định chi tiết trong <Link to="/refund-policy" className="text-blue-600 hover:underline">Chính sách Hủy phòng & Hoàn tiền</Link>. 
              Bằng việc đặt phòng, bạn đồng ý tuân thủ chính sách này.
            </p>
          </section>

          {/* 7. Quyền sở hữu trí tuệ */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Quyền sở hữu trí tuệ</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tất cả nội dung trên nền tảng, bao gồm nhưng không giới hạn: logo, hình ảnh, văn bản, phần mềm, và thiết kế, 
              đều thuộc quyền sở hữu của Fiscondotel hoặc các bên cấp phép. Bạn không được sao chép, phân phối, hoặc sử dụng 
              bất kỳ nội dung nào mà không có sự cho phép bằng văn bản của chúng tôi.
            </p>
          </section>

          {/* 8. Miễn trừ trách nhiệm */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Miễn trừ trách nhiệm</h2>
            <div className="space-y-4 text-gray-600">
              <p>
                Chúng tôi cung cấp nền tảng "như hiện có" và không đảm bảo rằng dịch vụ sẽ luôn hoạt động không gián đoạn hoặc không có lỗi. 
                Chúng tôi không chịu trách nhiệm về:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Bất kỳ thiệt hại nào phát sinh từ việc sử dụng hoặc không thể sử dụng dịch vụ</li>
                <li>Thông tin không chính xác hoặc không đầy đủ từ Host</li>
                <li>Hành vi của Host hoặc các bên thứ ba</li>
                <li>Các sự kiện bất khả kháng như thiên tai, dịch bệnh, hoặc quy định của chính phủ</li>
              </ul>
            </div>
          </section>

          {/* 9. Giới hạn trách nhiệm */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Giới hạn trách nhiệm</h2>
            <p className="text-gray-600 leading-relaxed">
              Trong phạm vi tối đa được phép bởi pháp luật, trách nhiệm của chúng tôi đối với bất kỳ thiệt hại nào phát sinh từ 
              việc sử dụng dịch vụ sẽ không vượt quá số tiền bạn đã thanh toán cho đặt phòng gây ra thiệt hại đó.
            </p>
          </section>

          {/* 10. Thay đổi điều khoản */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Thay đổi điều khoản</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có quyền thay đổi các điều khoản này bất cứ lúc nào. Các thay đổi sẽ có hiệu lực ngay sau khi được đăng tải trên nền tảng. 
              Việc bạn tiếp tục sử dụng dịch vụ sau khi có thay đổi được coi là bạn đã chấp nhận các điều khoản mới.
            </p>
          </section>

          {/* 11. Luật áp dụng */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Luật áp dụng</h2>
            <p className="text-gray-600 leading-relaxed">
              Các điều khoản này được điều chỉnh bởi pháp luật Việt Nam. Mọi tranh chấp phát sinh sẽ được giải quyết tại Tòa án có thẩm quyền tại Việt Nam.
            </p>
          </section>

          {/* 12. Liên hệ */}
          <section className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Cần hỗ trợ thêm?</h2>
            <p className="text-blue-800 mb-4">
              Nếu bạn có bất kỳ câu hỏi nào về điều khoản sử dụng, vui lòng liên hệ với chúng tôi.
            </p>
            <div className="flex gap-4">
              <Link to="/contact" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Liên hệ ngay
              </Link>
              <a href="mailto:fiscondotel23@fiscondotel.com" className="px-4 py-2 bg-white text-blue-600 border border-blue-200 font-semibold rounded-lg hover:bg-blue-50 transition-colors">
                Email: fiscondotel23@fiscondotel.com
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PageTerms;


