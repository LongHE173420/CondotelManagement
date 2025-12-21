import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "contexts/AuthContext";
import hostAPI, { HostVerificationStatusDTO, ValidateIdCardResponseDTO } from "api/host";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";

const HostVerificationContent: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<HostVerificationStatusDTO | null>(null);
  const [validationResult, setValidationResult] = useState<ValidateIdCardResponseDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreview, setFrontPreview] = useState<string | null>(null);
  const [backPreview, setBackPreview] = useState<string | null>(null);

  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Check if user is Host
    if (!isAuthenticated || user?.roleName !== "Host") {
      navigate("/");
      return;
    }
    loadVerificationStatus();
  }, [isAuthenticated, user, navigate]);

  const loadVerificationStatus = async () => {
    setLoading(true);
    setError("");
    try {
      const status = await hostAPI.getVerificationStatus();
      setVerificationStatus(status);
      
      // Nếu đã có ảnh upload, tự động validate
      if (status && status.idCardFrontUrl && status.idCardBackUrl) {
        // Chỉ validate nếu chưa có kết quả validation hoặc status là Pending
        if (!validationResult || status.verificationStatus === "Pending") {
          await validateIdCard();
        }
      }
    } catch (err: any) {
      // Nếu endpoint không tồn tại hoặc chưa có verification, không báo lỗi
      if (err.response?.status !== 404) {
      }
      setVerificationStatus(null);
    } finally {
      setLoading(false);
    }
  };

  const validateIdCard = async () => {
    setValidating(true);
    setError("");
    setSuccess("");
    try {
      const result = await hostAPI.validateIdCard();
      setValidationResult(result);
      
      if (result.isValid) {
        setSuccess(result.message || "Thông tin CCCD đã được xác thực thành công!");
      } else {
        setError(result.message || "Thông tin CCCD không khớp với thông tin tài khoản");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể xác thực thông tin CCCD");
    } finally {
      setValidating(false);
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "front" | "back"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("File phải là ảnh hợp lệ!");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Ảnh không được vượt quá 10MB!");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === "front") {
        setFrontFile(file);
        setFrontPreview(reader.result as string);
      } else {
        setBackFile(file);
        setBackPreview(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
    setError("");
  };

  const handleUpload = async () => {
    if (!frontFile || !backFile) {
      setError("Vui lòng chọn đầy đủ ảnh mặt trước và mặt sau CCCD!");
      return;
    }

    setUploading(true);
    setError("");
    setSuccess("");

    try {
      const result = await hostAPI.verifyWithIdCard(frontFile, backFile);
      
      if (result.success) {
        setSuccess(result.message || "Upload ảnh CCCD thành công! Đang xử lý OCR...");
        
        // Lưu verification status từ response
        if (result.data) {
          setVerificationStatus({
            idCardFrontUrl: result.data.idCardFrontUrl,
            idCardBackUrl: result.data.idCardBackUrl,
            verificationStatus: result.data.verificationStatus || "Pending",
            verifiedAt: result.data.verifiedAt,
            verificationNote: result.data.verificationNote,
          });
        }
        
        // Clear file previews sau khi upload thành công
        setFrontFile(null);
        setBackFile(null);
        setFrontPreview(null);
        setBackPreview(null);
        if (frontFileInputRef.current) frontFileInputRef.current.value = "";
        if (backFileInputRef.current) backFileInputRef.current.value = "";
        
        // Tự động validate sau khi upload (đợi một chút để backend xử lý OCR)
        setTimeout(async () => {
          await validateIdCard();
        }, 2000);
      } else {
        setError(result.message || "Upload thất bại");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể upload ảnh CCCD. Vui lòng thử lại!");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveFile = (type: "front" | "back") => {
    if (type === "front") {
      setFrontFile(null);
      setFrontPreview(null);
      if (frontFileInputRef.current) {
        frontFileInputRef.current.value = "";
      }
    } else {
      setBackFile(null);
      setBackPreview(null);
      if (backFileInputRef.current) {
        backFileInputRef.current.value = "";
      }
    }
  };

  const getStatusBadge = (status?: string) => {
    const statusLower = status?.toLowerCase() || "";
    if (statusLower === "approved") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400">
          ✅ Đã xác thực
        </span>
      );
    } else if (statusLower === "rejected") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400">
          ❌ Bị từ chối
        </span>
      );
    } else {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700 border border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400">
          ⏳ Đang chờ duyệt
        </span>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Xác thực CCCD</h2>
          <p className="text-neutral-600 dark:text-neutral-400 mt-1">
            Upload ảnh CCCD để xác thực danh tính và nhận thanh toán từ hệ thống
          </p>
        </div>
        {verificationStatus && (
          <div>
            {getStatusBadge(verificationStatus.verificationStatus)}
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          <button
            onClick={() => setError("")}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Đóng
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <p className="text-sm text-green-800 dark:text-green-200">{success}</p>
          <button
            onClick={() => setSuccess("")}
            className="mt-2 text-sm text-green-600 underline hover:text-green-800"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Upload Section */}
      {!verificationStatus?.idCardFrontUrl && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Upload ảnh CCCD
          </h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-6">
            Vui lòng upload ảnh mặt trước và mặt sau CCCD của bạn. Hệ thống sẽ tự động đọc thông tin và xác thực.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Front Image */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Ảnh mặt trước CCCD *
              </label>
              {frontPreview ? (
                <div className="relative">
                  <img
                    src={frontPreview}
                    alt="Mặt trước CCCD"
                    className="w-full h-64 object-contain border-2 border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700"
                  />
                  <button
                    onClick={() => handleRemoveFile("front")}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => frontFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                >
                  <svg
                    className="mx-auto h-12 w-12 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Click để chọn ảnh
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                    JPG, PNG (tối đa 10MB)
                  </p>
                </div>
              )}
              <input
                ref={frontFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "front")}
                className="hidden"
              />
            </div>

            {/* Back Image */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Ảnh mặt sau CCCD *
              </label>
              {backPreview ? (
                <div className="relative">
                  <img
                    src={backPreview}
                    alt="Mặt sau CCCD"
                    className="w-full h-64 object-contain border-2 border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700"
                  />
                  <button
                    onClick={() => handleRemoveFile("back")}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <div
                  onClick={() => backFileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                >
                  <svg
                    className="mx-auto h-12 w-12 text-neutral-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Click để chọn ảnh
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mt-1">
                    JPG, PNG (tối đa 10MB)
                  </p>
                </div>
              )}
              <input
                ref={backFileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, "back")}
                className="hidden"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <ButtonPrimary
              onClick={handleUpload}
              disabled={!frontFile || !backFile || uploading}
            >
              {uploading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Đang upload...
                </span>
              ) : (
                "Upload và Xác thực"
              )}
            </ButtonPrimary>
          </div>
        </div>
      )}

      {/* Verification Status */}
      {verificationStatus && verificationStatus.idCardFrontUrl && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Trạng thái xác thực
            </h3>
            <ButtonSecondary
              onClick={validateIdCard}
              disabled={validating}
            >
              {validating ? "Đang kiểm tra..." : "Kiểm tra lại"}
            </ButtonSecondary>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Ảnh mặt trước CCCD
              </label>
              <img
                src={verificationStatus.idCardFrontUrl}
                alt="Mặt trước CCCD"
                className="w-full h-64 object-contain border-2 border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                Ảnh mặt sau CCCD
              </label>
              <img
                src={verificationStatus.idCardBackUrl}
                alt="Mặt sau CCCD"
                className="w-full h-64 object-contain border-2 border-neutral-300 dark:border-neutral-600 rounded-lg bg-neutral-50 dark:bg-neutral-700"
              />
            </div>
          </div>

          {verificationStatus.verificationNote && (
            <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                <strong>Ghi chú:</strong> {verificationStatus.verificationNote}
              </p>
            </div>
          )}

          {verificationStatus.verifiedAt && (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Xác thực lúc: {new Date(verificationStatus.verifiedAt).toLocaleString("vi-VN")}
            </div>
          )}
        </div>
      )}

      {/* Validation Result */}
      {validationResult && (
        <div className="bg-white dark:bg-neutral-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Kết quả xác thực
          </h3>

          <div className={`p-4 rounded-lg mb-4 ${
            validationResult.isValid
              ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
              : "bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800"
          }`}>
            <p className={`text-sm font-medium ${
              validationResult.isValid
                ? "text-green-800 dark:text-green-200"
                : "text-yellow-800 dark:text-yellow-200"
            }`}>
              {validationResult.message}
            </p>
          </div>

          {validationResult.details && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Tên khớp:</span>
                  <span className={`text-sm font-medium ${
                    validationResult.details.nameMatch
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {validationResult.details.nameMatch ? "✅ Có" : "❌ Không"}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">Số CCCD khớp:</span>
                  <span className={`text-sm font-medium ${
                    validationResult.details.idNumberMatch
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}>
                    {validationResult.details.idNumberMatch ? "✅ Có" : "❌ Không"}
                  </span>
                </div>
                {validationResult.details.dateOfBirthMatch !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Ngày sinh khớp:</span>
                    <span className={`text-sm font-medium ${
                      validationResult.details.dateOfBirthMatch
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {validationResult.details.dateOfBirthMatch ? "✅ Có" : "❌ Không"}
                    </span>
                  </div>
                )}
                {validationResult.details.vietQRVerified !== undefined && (
                  <div className="flex items-center justify-between p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <span className="text-sm text-neutral-600 dark:text-neutral-400">Xác thực VietQR:</span>
                    <span className={`text-sm font-medium ${
                      validationResult.details.vietQRVerified
                        ? "text-green-600 dark:text-green-400"
                        : "text-red-600 dark:text-red-400"
                    }`}>
                      {validationResult.details.vietQRVerified ? "✅ Thành công" : "❌ Thất bại"}
                    </span>
                  </div>
                )}
              </div>

              {validationResult.details.userFullName && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Tên trong tài khoản:</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {validationResult.details.userFullName}
                  </p>
                </div>
              )}

              {validationResult.details.idCardFullName && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Tên trên CCCD:</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                    {validationResult.details.idCardFullName}
                  </p>
                </div>
              )}

              {validationResult.details.idCardNumber && (
                <div className="p-3 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-1">Số CCCD:</p>
                  <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100 font-mono">
                    {validationResult.details.idCardNumber}
                  </p>
                </div>
              )}

              {validationResult.details.vietQRMessage && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>VietQR:</strong> {validationResult.details.vietQRMessage}
                  </p>
                </div>
              )}

              {validationResult.details.errors && validationResult.details.errors.length > 0 && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">Lỗi:</p>
                  <ul className="list-disc list-inside text-sm text-red-700 dark:text-red-300 space-y-1">
                    {validationResult.details.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">
              Thông tin về xác thực CCCD
            </h3>
            <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
              <ul className="list-disc list-inside space-y-1">
                <li>Hệ thống sẽ tự động đọc thông tin từ ảnh CCCD bằng OCR</li>
                <li>So sánh thông tin với tài khoản của bạn (tên, số CCCD, ngày sinh)</li>
                <li>Xác thực với hệ thống quốc gia qua VietQR API</li>
                <li>Tự động duyệt nếu thông tin khớp hoặc VietQR xác thực thành công</li>
                <li>Admin sẽ xem xét và duyệt/từ chối nếu cần</li>
                <li>Chỉ host đã được xác thực mới có thể nhận thanh toán từ hệ thống</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HostVerificationContent;

