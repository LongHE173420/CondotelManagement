import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const PagePrivacy = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Helmet>
        <title>Chính sách bảo mật || Fiscondotel</title>
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
            Chính sách bảo mật
          </h1>
          <p className="text-gray-600 mt-2">Cập nhật lần cuối: {new Date().toLocaleDateString("vi-VN")}</p>
        </div>
      </div>

      {/* --- Nội dung chính --- */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white p-8 md:p-12 rounded-2xl shadow-sm space-y-10">
          
          {/* 1. Giới thiệu */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Cam kết bảo mật</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Tại <strong>Fiscondotel</strong>, chúng tôi cam kết bảo vệ quyền riêng tư và thông tin cá nhân của bạn. 
              Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin của bạn khi sử dụng dịch vụ của chúng tôi.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Bằng việc sử dụng dịch vụ, bạn đồng ý với các thực hành được mô tả trong chính sách này.
            </p>
          </section>

          {/* 2. Thông tin chúng tôi thu thập */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Thông tin chúng tôi thu thập</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2.1. Thông tin cá nhân</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Họ và tên</li>
                  <li>Địa chỉ email</li>
                  <li>Số điện thoại</li>
                  <li>Ngày sinh</li>
                  <li>Giới tính</li>
                  <li>Địa chỉ</li>
                  <li>Thông tin thanh toán (được mã hóa và bảo mật)</li>
                  <li>Ảnh đại diện (nếu bạn tải lên)</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2.2. Thông tin giao dịch</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Lịch sử đặt phòng</li>
                  <li>Thông tin thanh toán</li>
                  <li>Đánh giá và nhận xét</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2.3. Thông tin kỹ thuật</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Địa chỉ IP</li>
                  <li>Loại trình duyệt và thiết bị</li>
                  <li>Thông tin hệ điều hành</li>
                  <li>Cookies và công nghệ theo dõi tương tự</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Cách chúng tôi sử dụng thông tin */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Cách chúng tôi sử dụng thông tin</h2>
            <div className="space-y-4 text-gray-600">
              <p>Chúng tôi sử dụng thông tin của bạn để:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Cung cấp và cải thiện dịch vụ đặt phòng condotel</li>
                <li>Xử lý đặt phòng và thanh toán</li>
                <li>Gửi xác nhận đặt phòng và thông báo quan trọng</li>
                <li>Hỗ trợ khách hàng và giải quyết vấn đề</li>
                <li>Gửi thông tin khuyến mãi và cập nhật (nếu bạn đồng ý)</li>
                <li>Phân tích và cải thiện trải nghiệm người dùng</li>
                <li>Tuân thủ các nghĩa vụ pháp lý</li>
                <li>Ngăn chặn gian lận và lạm dụng</li>
              </ul>
            </div>
          </section>

          {/* 4. Chia sẻ thông tin */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Chia sẻ thông tin</h2>
            <div className="space-y-4 text-gray-600">
              <p>Chúng tôi không bán thông tin cá nhân của bạn. Chúng tôi chỉ chia sẻ thông tin trong các trường hợp sau:</p>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4.1. Với Host</h3>
                <p>Khi bạn đặt phòng, chúng tôi chia sẻ thông tin cần thiết (tên, email, số điện thoại) với Host để họ có thể liên hệ và phục vụ bạn.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4.2. Với nhà cung cấp dịch vụ</h3>
                <p>Chúng tôi có thể chia sẻ thông tin với các đối tác cung cấp dịch vụ thanh toán, hosting, và phân tích để vận hành nền tảng.</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4.3. Yêu cầu pháp lý</h3>
                <p>Chúng tôi có thể tiết lộ thông tin nếu được yêu cầu bởi cơ quan pháp luật hoặc để bảo vệ quyền và an toàn của chúng tôi và người dùng khác.</p>
              </div>
            </div>
          </section>

          {/* 5. Bảo mật thông tin */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Bảo mật thông tin</h2>
            <div className="space-y-4 text-gray-600">
              <p>Chúng tôi áp dụng các biện pháp bảo mật kỹ thuật và tổ chức để bảo vệ thông tin của bạn:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Mã hóa dữ liệu trong quá trình truyền tải (SSL/TLS)</li>
                <li>Mã hóa thông tin nhạy cảm khi lưu trữ</li>
                <li>Giới hạn quyền truy cập thông tin chỉ cho nhân viên cần thiết</li>
                <li>Thường xuyên kiểm tra và cập nhật hệ thống bảo mật</li>
                <li>Tuân thủ các tiêu chuẩn bảo mật quốc tế</li>
              </ul>
            </div>
          </section>

          {/* 6. Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Cookies và công nghệ theo dõi</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Chúng tôi sử dụng cookies và công nghệ tương tự để cải thiện trải nghiệm của bạn, phân tích lưu lượng truy cập, 
              và cá nhân hóa nội dung. Bạn có thể quản lý cài đặt cookies trong trình duyệt của mình.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Tuy nhiên, việc tắt cookies có thể ảnh hưởng đến một số chức năng của website.
            </p>
          </section>

          {/* 7. Quyền của bạn */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Quyền của bạn</h2>
            <p className="text-gray-600 leading-relaxed mb-4">Bạn có các quyền sau đối với thông tin cá nhân của mình:</p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li><strong>Quyền truy cập:</strong> Bạn có thể yêu cầu xem thông tin cá nhân mà chúng tôi lưu trữ về bạn.</li>
              <li><strong>Quyền chỉnh sửa:</strong> Bạn có thể cập nhật thông tin cá nhân trong tài khoản của mình.</li>
              <li><strong>Quyền xóa:</strong> Bạn có thể yêu cầu xóa tài khoản và thông tin cá nhân (trừ thông tin chúng tôi phải lưu trữ theo quy định pháp luật).</li>
              <li><strong>Quyền từ chối:</strong> Bạn có thể từ chối nhận email marketing bằng cách cập nhật cài đặt tài khoản.</li>
              <li><strong>Quyền khiếu nại:</strong> Bạn có quyền khiếu nại với cơ quan quản lý nếu bạn cho rằng chúng tôi xử lý thông tin không đúng.</li>
            </ul>
          </section>

          {/* 8. Lưu trữ thông tin */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Lưu trữ thông tin</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi lưu trữ thông tin của bạn trong thời gian cần thiết để cung cấp dịch vụ và tuân thủ các nghĩa vụ pháp lý. 
              Khi bạn xóa tài khoản, chúng tôi sẽ xóa hoặc ẩn danh hóa thông tin cá nhân của bạn, trừ những thông tin chúng tôi phải 
              lưu trữ theo quy định pháp luật (ví dụ: hồ sơ giao dịch).
            </p>
          </section>

          {/* 9. Thay đổi chính sách */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Thay đổi chính sách</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Các thay đổi sẽ được đăng tải trên trang này với 
              ngày cập nhật mới nhất. Chúng tôi khuyến khích bạn xem lại chính sách này định kỳ.
            </p>
          </section>

          {/* 10. Liên hệ */}
          <section className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Liên hệ về bảo mật</h2>
            <p className="text-blue-800 mb-4">
              Nếu bạn có câu hỏi hoặc yêu cầu về chính sách bảo mật hoặc thông tin cá nhân của bạn, vui lòng liên hệ:
            </p>
            <div className="space-y-2 text-blue-800">
              <p><strong>Email:</strong> fiscondotel23@fiscondotel.com</p>
              <p><strong>Địa chỉ:</strong> Hòa Lạc, Thạch Thất, Hà Nội</p>
              <p><strong>Điện thoại:</strong> 0397-139-645</p>
            </div>
            <div className="mt-4">
              <Link to="/contact" className="inline-block px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                Liên hệ ngay
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
};

export default PagePrivacy;


