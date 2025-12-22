import React, { FC, useState, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Input from "shared/Input/Input";

export interface PriceItem {
  priceId?: number;
  startDate: string;
  endDate: string;
  basePrice: number;
  priceType: string;
  description?: string;
}

interface PriceModalProps {
  show: boolean;
  onClose: () => void;
  prices: PriceItem[];
  onSave: (prices: PriceItem[]) => void;
}

const PriceModal: FC<PriceModalProps> = ({ show, onClose, prices, onSave }) => {
  const [localPrices, setLocalPrices] = useState<PriceItem[]>(prices);

  useEffect(() => {
    setLocalPrices(prices);
  }, [prices]);

  const handleSave = () => {
    // Validate dates
    for (const price of localPrices) {
      const startDate = price.startDate ? new Date(price.startDate) : null;
      const endDate = price.endDate ? new Date(price.endDate) : null;
      if (startDate && endDate && startDate >= endDate) {
        alert("Ngày bắt đầu phải nhỏ hơn ngày kết thúc!");
        return;
      }
      // Validate description not empty
      if (!price.description || price.description.trim() === "") {
        alert("Mô tả giá không được để trống!");
        return;
      }
    }
    onSave(localPrices);
    onClose();
  };

  const addPrice = () => {
    setLocalPrices([
      ...localPrices,
      {
        priceId: 0,
        startDate: "",
        endDate: "",
        basePrice: 0,
        priceType: "Thường",
        description: undefined,
      },
    ]);
  };

  const removePrice = (index: number) => {
    setLocalPrices(localPrices.filter((_, i) => i !== index));
  };

  return (
    <Transition appear show={show} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 shadow-2xl transition-all">
                {/* Header */}
                <div className="px-6 py-5 border-b border-neutral-200 dark:border-neutral-700 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-900/20 dark:to-orange-900/20">
                  <Dialog.Title className="text-xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg text-white shadow-lg">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    Quản lý giá theo thời gian
                  </Dialog.Title>
                </div>

                {/* Content */}
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                  <div className="space-y-4">
                    {localPrices.map((price, index) => {
                      const startDate = price.startDate ? new Date(price.startDate) : null;
                      const endDate = price.endDate ? new Date(price.endDate) : null;
                      const hasDateError = !!(startDate && endDate && startDate >= endDate);

                      return (
                        <div
                          key={index}
                          className={`p-5 border-2 rounded-xl space-y-4 transition-all duration-200 ${
                            hasDateError
                              ? "border-red-400 dark:border-red-600 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/30 dark:to-pink-900/20 shadow-md shadow-red-500/20"
                              : "border-neutral-200 dark:border-neutral-700 bg-white/50 dark:bg-neutral-800/50 hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-lg"
                          }`}
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Ngày bắt đầu
                              </label>
                              <Input
                                type="date"
                                value={price.startDate || ""}
                                onChange={(e) => {
                                  const newPrices = [...localPrices];
                                  newPrices[index].startDate = e.target.value;
                                  setLocalPrices(newPrices);
                                }}
                                className={`w-full ${hasDateError ? "border-red-500" : ""}`}
                              />
                              {hasDateError && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  ⚠️ Ngày bắt đầu phải nhỏ hơn ngày kết thúc
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Ngày kết thúc
                              </label>
                              <Input
                                type="date"
                                value={price.endDate || ""}
                                onChange={(e) => {
                                  const newPrices = [...localPrices];
                                  newPrices[index].endDate = e.target.value;
                                  setLocalPrices(newPrices);
                                }}
                                className={`w-full ${hasDateError ? "border-red-500" : ""}`}
                              />
                              {hasDateError && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                  ⚠️ Ngày kết thúc phải lớn hơn ngày bắt đầu
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Giá cơ bản (VNĐ) *
                              </label>
                              <Input
                                type="number"
                                value={price.basePrice || ""}
                                onChange={(e) => {
                                  const newPrices = [...localPrices];
                                  newPrices[index].basePrice = e.target.value ? Number(e.target.value) : 0;
                                  setLocalPrices(newPrices);
                                }}
                                className="w-full"
                                placeholder="Nhập giá (VNĐ)"
                                min="0"
                                step="1000"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                                Loại giá
                              </label>
                              <select
                                value={price.priceType || "Thường"}
                                onChange={(e) => {
                                  const newPrices = [...localPrices];
                                  newPrices[index].priceType = e.target.value;
                                  setLocalPrices(newPrices);
                                }}
                                className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100"
                              >
                                <option value="Thường">Thường</option>
                                <option value="Cuối tuần">Cuối tuần</option>
                                <option value="Ngày lễ">Ngày lễ</option>
                                <option value="Cao điểm">Cao điểm</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                              Mô tả *
                            </label>
                            <textarea
                              value={price.description || ""}
                              onChange={(e) => {
                                const newPrices = [...localPrices];
                                newPrices[index].description = e.target.value || undefined;
                                setLocalPrices(newPrices);
                              }}
                              rows={2}
                              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-neutral-700 dark:text-neutral-100 resize-none ${
                                !price.description || price.description.trim() === ""
                                  ? "border-red-500 dark:border-red-600"
                                  : "border-neutral-300 dark:border-neutral-600"
                              }`}
                              placeholder="Mô tả chi tiết về giá này (bắt buộc)..."
                              required
                            />
                            {(!price.description || price.description.trim() === "") && (
                              <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                ⚠️ Mô tả giá không được để trống
                              </p>
                            )}
                          </div>
                          <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                            <button
                              type="button"
                              onClick={() => removePrice(index)}
                              className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Xóa giá này
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={addPrice}
                      className="w-full px-5 py-3 bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 hover:from-primary-100 hover:to-blue-100 dark:hover:from-primary-900/30 dark:hover:to-blue-900/30 border-2 border-dashed border-primary-300 dark:border-primary-600 text-primary-700 dark:text-primary-300 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm giá mới
                    </button>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-900/50 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2.5 border-2 border-neutral-300 dark:border-neutral-600 text-neutral-700 dark:text-neutral-300 rounded-xl font-semibold hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all duration-200"
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-500 to-blue-500 hover:from-primary-600 hover:to-blue-600 text-white rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Lưu giá
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default PriceModal;
