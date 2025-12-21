import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import blogAPI, { BlogCategoryDTO } from "api/blog";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import ConfirmModal from "components/ConfirmModal";

const PageBlogCategory = () => {
  const [categories, setCategories] = useState<BlogCategoryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Form state
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null);
  const [deletingCategoryName, setDeletingCategoryName] = useState<string>("");
  const navigate = useNavigate();
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      setError("");
      // Sử dụng public API để lấy categories
      const cats = await blogAPI.getCategories();
      setCategories(cats);
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryName.trim()) {
      setError("Vui lòng nhập tên danh mục!");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");

    try {
      if (isEditing && editingId) {
        // Update category
        await blogAPI.adminUpdateCategory(editingId, categoryName.trim());
        setSuccessMessage("Cập nhật danh mục thành công!");
      } else {
        // Create category
        await blogAPI.adminCreateCategory(categoryName.trim());
        setSuccessMessage("Tạo danh mục thành công!");
      }

      // Reset form
      setCategoryName("");
      setIsEditing(false);
      setEditingId(null);

      // Reload categories
      await loadCategories();
    } catch (err: any) {
      let errorMessage = "Không thể lưu danh mục";

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (category: BlogCategoryDTO) => {
    setCategoryName(category.name);
    setIsEditing(true);
    setEditingId(category.categoryId);
    setError("");
    setSuccessMessage("");
  };

  const handleCancel = () => {
    setCategoryName("");
    setIsEditing(false);
    setEditingId(null);
    setError("");
    setSuccessMessage("");
  };

  const handleDelete = async (categoryId: number, categoryName: string) => {
    setDeletingCategoryId(categoryId);
    setDeletingCategoryName(categoryName);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!deletingCategoryId) return;
    setShowConfirmModal(false);
    try {
      const categoryId = deletingCategoryId;
      const success = await blogAPI.adminDeleteCategory(categoryId);
      if (success) {
        setSuccessMessage("Xóa danh mục thành công!");
        await loadCategories();
      } else {
        setError("Không tìm thấy danh mục để xóa.");
      }
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể xóa danh mục");
    } finally {
      setDeletingCategoryId(null);
      setDeletingCategoryName("");
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
        <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-800"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
        {/* Header */}
        <div className="mb-6 flex justify-between items-start">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Quản lý Danh mục Blog
            </h1>
            <p className="text-gray-600">Tạo, chỉnh sửa và xóa các danh mục blog</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium transition"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Quay lại Dashboard
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-800 rounded-md">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-800 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mb-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            {isEditing ? "Chỉnh sửa Danh mục" : "Thêm Danh mục Mới"}
          </h2>

          <div className="flex gap-4">
            <input
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Nhập tên danh mục..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
              required
            />
            <ButtonPrimary
              type="submit"
              disabled={isSubmitting}
              className="px-6"
            >
              {isSubmitting ? "Đang lưu..." : isEditing ? "Cập nhật" : "Thêm mới"}
            </ButtonPrimary>
            {isEditing && (
              <ButtonSecondary
                type="button"
                onClick={handleCancel}
                className="px-6"
              >
                Hủy
              </ButtonSecondary>
            )}
          </div>
        </form>

        {/* Categories List */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-800">
            Danh sách Danh mục ({categories.length})
          </h2>

          {categories.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>Chưa có danh mục nào. Hãy tạo danh mục đầu tiên!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên danh mục
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Slug
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hành động
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {categories.map((category) => (
                    <tr key={category.categoryId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {category.categoryId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {category.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {category.slug || "—"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(category)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDelete(category.categoryId, category.name)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageBlogCategory;

