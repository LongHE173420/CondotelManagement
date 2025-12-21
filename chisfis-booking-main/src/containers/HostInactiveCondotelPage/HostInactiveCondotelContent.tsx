import React, { useEffect, useState } from "react";
import condotelAPI, { CondotelDTO } from "api/condotel";
import { toastSuccess, toastError } from "utils/toast";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import Button from "shared/Button/Button";
import ConfirmModal from "components/ConfirmModal";

const HostInactiveCondotelContent = () => {
  const [condotels, setCondotels] = useState<CondotelDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [activating, setActivating] = useState<number | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [activatingId, setActivatingId] = useState<number | null>(null);

  useEffect(() => {
    fetchInactiveCondotels();
  }, [currentPage]);

  const fetchInactiveCondotels = async () => {
    try {
      setLoading(true);
      const result = await condotelAPI.getInactiveCondotels(currentPage, pageSize);
      setCondotels(result.items);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (error: any) {
      toastError(error.response?.data?.message || "Không thể tải danh sách condotel inactive");
      setCondotels([]);
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (condotelId: number) => {
    setActivatingId(condotelId);
    setShowConfirmModal(true);
  };

  const confirmActivate = async () => {
    if (!activatingId) return;
    setShowConfirmModal(false);
    try {
      setActivating(activatingId);
      const result = await condotelAPI.activateCondotel(activatingId);
      toastSuccess(result.message || "Đã kích hoạt condotel thành công");
      
      // Refresh list
      await fetchInactiveCondotels();
    } catch (error: any) {
      toastError(error.response?.data?.message || "Không thể kích hoạt condotel");
    } finally {
      setActivating(null);
      setActivatingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (loading && condotels.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Condotel Không Hoạt Động</h2>
          <p className="text-neutral-500 mt-1">
            Tổng số: {totalCount} condotel
          </p>
        </div>
      </div>

      {/* Condotel List */}
      {condotels.length === 0 ? (
        <div className="text-center py-20">
          <svg
            className="mx-auto h-12 w-12 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
            Không có condotel nào
          </h3>
          <p className="mt-1 text-sm text-neutral-500">
            Tất cả condotel của bạn đang ở trạng thái hoạt động
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {condotels.map((condotel) => (
            <div
              key={condotel.condotelId}
              className="flex flex-col sm:flex-row gap-5 bg-white dark:bg-neutral-900 rounded-2xl shadow-md hover:shadow-lg transition-shadow p-5"
            >
              {/* Thumbnail */}
              <div className="w-full sm:w-64 h-48 flex-shrink-0">
                <img
                  src={condotel.thumbnailUrl || "/placeholder.png"}
                  alt={condotel.name}
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>

              {/* Content */}
              <div className="flex-grow space-y-3">
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    {condotel.name}
                  </h3>
                  {condotel.resortName && (
                    <p className="text-sm text-neutral-500 mt-1">
                      📍 {condotel.resortName}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                  <div className="flex items-center gap-1">
                    <span>🛏️</span>
                    <span>{condotel.beds} giường</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>🚿</span>
                    <span>{condotel.bathrooms} phòng tắm</span>
                  </div>
                  {condotel.reviewCount !== undefined && (
                    <div className="flex items-center gap-1">
                      <span>⭐</span>
                      <span>
                        {condotel.reviewRate?.toFixed(1) || "0.0"} ({condotel.reviewCount} đánh giá)
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-neutral-700">
                  <div>
                    <span className="text-2xl font-semibold text-primary-500">
                      {formatPrice(condotel.pricePerNight)}
                    </span>
                    <span className="text-neutral-500 text-sm ml-1">/đêm</span>
                  </div>

                  <ButtonPrimary
                    onClick={() => handleActivate(condotel.condotelId)}
                    disabled={activating === condotel.condotelId}
                    className="!px-6"
                  >
                    {activating === condotel.condotelId ? (
                      <span className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Đang kích hoạt...
                      </span>
                    ) : (
                      "Kích hoạt lại"
                    )}
                  </ButtonPrimary>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1 || loading}
            className="!px-4"
          >
            Trước
          </Button>

          <span className="px-4 py-2 text-neutral-700 dark:text-neutral-300">
            Trang {currentPage} / {totalPages}
          </span>

          <Button
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages || loading}
            className="!px-4"
          >
            Sau
          </Button>
        </div>
      )}

      <ConfirmModal
        show={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          setActivatingId(null);
        }}
        onConfirm={confirmActivate}
        title="Xác nhận kích hoạt condotel"
        message="Bạn có chắc chắn muốn kích hoạt lại condotel này?"
        confirmText="Kích hoạt"
        cancelText="Hủy"
        type="success"
      />
    </div>
  );
};

export default HostInactiveCondotelContent;
