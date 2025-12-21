import { BookingDTO } from "api/booking";
import { UserProfile } from "api/auth";

/**
 * Kiểm tra xem user hiện tại có phải là chủ sở hữu của booking không
 * @param booking - Booking cần kiểm tra
 * @param user - User hiện tại
 * @returns true nếu user là chủ sở hữu, false nếu không
 */
export const isBookingOwner = (booking: BookingDTO | null, user: UserProfile | null): boolean => {
  if (!booking || !user) {
    return false;
  }
  
  // So sánh customerId của booking với userId của user
  return booking.customerId === user.userId;
};

/**
 * Validate booking ownership và throw error nếu không phải chủ sở hữu
 * @param booking - Booking cần kiểm tra
 * @param user - User hiện tại
 * @throws Error nếu user không phải chủ sở hữu
 */
export const validateBookingOwnership = (
  booking: BookingDTO | null,
  user: UserProfile | null
): void => {
  if (!user) {
    throw new Error("Vui lòng đăng nhập để xem thông tin booking");
  }
  
  if (!booking) {
    throw new Error("Không tìm thấy booking");
  }
  
  if (!isBookingOwner(booking, user)) {
    throw new Error("Bạn không có quyền truy cập booking này");
  }
};



