import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

// Component Star (để chọn 1-5 sao)
const StarRating: React.FC<{ rating: number; setRating: (rating: number) => void }> = ({ rating, setRating }) => {
  return (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          onClick={() => setRating(star)}
          className={`w-10 h-10 cursor-pointer ${
            star <= rating ? "text-yellow-400" : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
};

// Component chính của trang viết Review
const PageWriteReview = () => {
  const { id } = useParams(); // ID này là ID của ĐƠN ĐẶT PHÒNG (bookingId)
  const navigate = useNavigate();
  
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      alert("Vui lòng chọn số sao đánh giá.");
      return;
    }
    setLoading(true);

    // TODO: Gọi API để gửi đánh giá
    console.log({
      bookingId: id,
      rating: rating,
      comment: reviewText,
    });
    
    // Giả lập gọi API
    setTimeout(() => {
      setLoading(false);
      alert("Cảm ơn bạn đã đánh giá!");
      navigate("/booking-history"); // Quay lại trang lịch sử
    }, 1000);
  };

  return (
    <div className="p-4 md:p-8 bg-gray-100 min-h-screen flex items-center justify-center">
      <div className="max-w-2xl w-full mx-auto bg-white p-6 md:p-8 rounded-2xl shadow-xl">
        <form onSubmit={handleSubmit}>
          <h1 className="text-3xl font-semibold text-gray-800 tracking-tight text-center">
            Đánh giá của bạn
          </h1>
          <p className="text-gray-500 text-center mt-2 mb-6">
            Bạn đang đánh giá cho đơn đặt phòng #{id}
          </p>

          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-3">1. Bạn đánh giá bao nhiêu sao?</h2>
            <div className="flex justify-center">
              <StarRating rating={rating} setRating={setRating} />
            </div>
          </div>
          
          <div className="mb-6">
            <label htmlFor="reviewText" className="block text-lg font-semibold text-gray-700 mb-3">
              2. Viết nhận xét của bạn
            </label>
            <textarea
              id="reviewText"
              rows={6}
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Căn hộ này thế nào? Dịch vụ ra sao?..."
            ></textarea>
          </div>

          <div className="flex justify-end items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)} // Nút Hủy, quay lại trang trước
              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white font-semibold rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PageWriteReview;