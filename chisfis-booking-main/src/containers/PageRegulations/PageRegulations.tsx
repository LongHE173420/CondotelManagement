import React from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";

const PageRegulations = () => {
  return (
    <div className="bg-gray-50 min-h-screen font-sans">
      <Helmet>
        <title>Quy định cộng đồng || Fiscondotel</title>
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
            Quy định cộng đồng
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
              <strong>Fiscondotel</strong> là một cộng đồng dựa trên sự tin cậy và tôn trọng lẫn nhau. 
              Các quy định này được thiết lập để đảm bảo trải nghiệm tích cực và an toàn cho tất cả thành viên - 
              bao gồm Host (chủ nhà), Tenant (khách thuê), và đội ngũ của chúng tôi.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Bằng việc sử dụng dịch vụ, bạn cam kết tuân thủ các quy định này. Vi phạm có thể dẫn đến việc tạm ngưng hoặc chấm dứt tài khoản.
            </p>
          </section>

          {/* 2. Quy định chung */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Quy định chung cho tất cả người dùng</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2.1. Hành vi cấm</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Không được sử dụng ngôn ngữ thô tục, xúc phạm, hoặc phân biệt đối xử</li>
                  <li>Không được đăng tải nội dung vi phạm pháp luật, đạo đức, hoặc quyền của người khác</li>
                  <li>Không được thực hiện các hoạt động gian lận, lừa đảo, hoặc lạm dụng hệ thống</li>
                  <li>Không được tạo nhiều tài khoản để tránh các hạn chế hoặc lừa đảo</li>
                  <li>Không được chia sẻ thông tin đăng nhập với người khác</li>
                  <li>Không được can thiệp vào hoạt động bình thường của nền tảng</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">2.2. Hành vi khuyến khích</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tôn trọng và lịch sự với mọi người</li>
                  <li>Giao tiếp rõ ràng và trung thực</li>
                  <li>Báo cáo các hành vi vi phạm hoặc đáng ngờ</li>
                  <li>Đánh giá và phản hồi một cách công bằng và chính xác</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 3. Quy định cho Host */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Quy định cho Host (Chủ nhà)</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3.1. Đăng tin condotel</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Chỉ đăng tin về condotel mà bạn sở hữu hoặc có quyền cho thuê hợp pháp</li>
                  <li>Thông tin phải chính xác, đầy đủ và cập nhật</li>
                  <li>Hình ảnh phải là ảnh thật của condotel, không được sử dụng ảnh từ nguồn khác</li>
                  <li>Giá cả phải minh bạch, không được ẩn phí hoặc phí phụ</li>
                  <li>Phải tuân thủ các quy định về an toàn và vệ sinh</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3.2. Quản lý đặt phòng</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Phản hồi yêu cầu đặt phòng trong vòng 24 giờ</li>
                  <li>Xác nhận hoặc từ chối đặt phòng một cách rõ ràng</li>
                  <li>Đảm bảo condotel sẵn sàng đúng như mô tả khi khách đến</li>
                  <li>Không được hủy đặt phòng đã xác nhận trừ trường hợp bất khả kháng</li>
                  <li>Giao tiếp lịch sự và hỗ trợ khách trong suốt thời gian lưu trú</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">3.3. Đánh giá và phản hồi</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Trả lời đánh giá một cách chuyên nghiệp và lịch sự</li>
                  <li>Không được yêu cầu khách đánh giá tích cực để đổi lấy ưu đãi</li>
                  <li>Không được trả thù hoặc đe dọa khách vì đánh giá tiêu cực</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 4. Quy định cho Tenant */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Quy định cho Tenant (Khách thuê)</h2>
            <div className="space-y-4 text-gray-600">
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4.1. Đặt phòng</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Chỉ đặt phòng khi bạn thực sự có ý định sử dụng</li>
                  <li>Cung cấp thông tin chính xác về số lượng khách và nhu cầu đặc biệt</li>
                  <li>Thanh toán đầy đủ và đúng hạn</li>
                  <li>Không được đặt phòng với mục đích gian lận hoặc lạm dụng</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4.2. Sử dụng condotel</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Tuân thủ nội quy của condotel và khu vực</li>
                  <li>Tôn trọng tài sản và không làm hư hại</li>
                  <li>Không được tổ chức tiệc tùng hoặc sự kiện lớn mà không được phép</li>
                  <li>Không được hút thuốc trong khu vực cấm</li>
                  <li>Giữ gìn vệ sinh và trả phòng đúng giờ</li>
                  <li>Báo cáo ngay các vấn đề hoặc sự cố cho Host</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800 mb-2">4.3. Đánh giá</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Đánh giá một cách trung thực và công bằng dựa trên trải nghiệm thực tế</li>
                  <li>Không được đăng đánh giá giả mạo hoặc có động cơ không trong sáng</li>
                  <li>Không được yêu cầu Host đổi lấy đánh giá tích cực</li>
                  <li>Không được đe dọa hoặc tống tiền Host</li>
                </ul>
              </div>
            </div>
          </section>

          {/* 5. Xử lý vi phạm */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Xử lý vi phạm</h2>
            <div className="space-y-4 text-gray-600">
              <p>Khi phát hiện vi phạm, chúng tôi có thể thực hiện các biện pháp sau:</p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li><strong>Cảnh báo:</strong> Gửi cảnh báo và yêu cầu chấm dứt hành vi vi phạm</li>
                <li><strong>Tạm ngưng:</strong> Tạm thời vô hiệu hóa tài khoản hoặc tính năng</li>
                <li><strong>Chấm dứt:</strong> Vĩnh viễn chấm dứt tài khoản và cấm sử dụng dịch vụ</li>
                <li><strong>Pháp lý:</strong> Trong trường hợp nghiêm trọng, chúng tôi có thể khởi kiện hoặc báo cáo cơ quan chức năng</li>
              </ul>
              <p className="mt-4">
                Quyết định xử lý sẽ được thông báo cho bạn và bạn có quyền khiếu nại nếu không đồng ý.
              </p>
            </div>
          </section>

          {/* 6. Báo cáo vi phạm */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Báo cáo vi phạm</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Nếu bạn phát hiện hành vi vi phạm quy định, vui lòng báo cáo cho chúng tôi ngay lập tức. 
              Chúng tôi sẽ xem xét và xử lý một cách nghiêm túc và bảo mật.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Bạn có thể báo cáo thông qua:
            </p>
            <ul className="list-disc list-inside space-y-1 text-gray-600 ml-4 mt-2">
              <li>Nút "Báo cáo" trên trang đánh giá hoặc tin đăng</li>
              <li>Email: fiscondotel23@fiscondotel.com</li>
              <li>Hotline: 0397-139-645</li>
              <li>Trang <Link to="/contact" className="text-blue-600 hover:underline">Liên hệ</Link></li>
            </ul>
          </section>

          {/* 7. Giải quyết tranh chấp */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Giải quyết tranh chấp</h2>
            <div className="space-y-4 text-gray-600">
              <p>Trong trường hợp có tranh chấp giữa Host và Tenant:</p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li><strong>Giao tiếp trực tiếp:</strong> Khuyến khích hai bên giao tiếp trực tiếp để giải quyết</li>
                <li><strong>Hỗ trợ từ Fiscondotel:</strong> Đội ngũ hỗ trợ của chúng tôi sẽ can thiệp nếu cần</li>
                <li><strong>Trung gian hòa giải:</strong> Chúng tôi có thể đóng vai trò trung gian để tìm giải pháp</li>
                <li><strong>Quyết định cuối cùng:</strong> Trong trường hợp không thể giải quyết, chúng tôi sẽ đưa ra quyết định dựa trên chính sách và bằng chứng</li>
              </ol>
            </div>
          </section>

          {/* 8. Cập nhật quy định */}
          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Cập nhật quy định</h2>
            <p className="text-gray-600 leading-relaxed">
              Chúng tôi có thể cập nhật các quy định này theo thời gian để phản ánh những thay đổi trong dịch vụ, 
              pháp luật, hoặc phản hồi từ cộng đồng. Các thay đổi sẽ được thông báo và có hiệu lực sau khi đăng tải.
            </p>
          </section>

          {/* 9. Liên hệ */}
          <section className="bg-blue-50 p-6 rounded-xl">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Cần hỗ trợ thêm?</h2>
            <p className="text-blue-800 mb-4">
              Nếu bạn có câu hỏi về quy định cộng đồng hoặc cần báo cáo vi phạm, vui lòng liên hệ với chúng tôi.
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

export default PageRegulations;


