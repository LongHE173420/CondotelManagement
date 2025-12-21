import React, { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import blogAPI, { BlogPostSummaryDTO } from "api/blog";
import { PostDataType } from "data/types";
import SectionAds from "./SectionAds";
import SectionSubscribe2 from "components/SectionSubscribe2/SectionSubscribe2";
import SectionMagazine5 from "./SectionMagazine5";
import SectionLatestPosts from "./SectionLatestPosts";
import BgGlassmorphism from "components/BgGlassmorphism/BgGlassmorphism";
import { useAuth } from "contexts/AuthContext";

// Helper function to convert BlogPostSummaryDTO to PostDataType
const convertToPostDataType = (post: BlogPostSummaryDTO): PostDataType => {
  return {
    id: post.postId,
    title: post.title,
    href: `/blog-single/${post.slug}`,
    featuredImage: post.featuredImageUrl || "/images/placeholder.png",
    desc: "",
    date: post.publishedAt || new Date().toISOString(),
    commentCount: 0, // Đặt là 0 để ẩn comment
    viewdCount: 0,
    readingTime: 5,
    postType: "standard",
    author: {
      id: 0,
      firstName: post.authorName?.split(" ")[0] || "Admin",
      lastName: post.authorName?.split(" ").slice(1).join(" ") || "",
      displayName: post.authorName || "Admin",
      avatar: "",
      count: 0,
      desc: "",
      jobName: "Author",
      href: "/",
    },
    categories: post.categoryName
      ? [
        {
          id: 0,
          name: post.categoryName,
          href: `/blog?category=${post.categoryName}`,
          taxonomy: "category",
        },
      ]
      : [],
  };
};

const BlogPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<PostDataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPosts = async () => {
      try {
        setLoading(true);
        const blogPosts = await blogAPI.getPublishedPosts();
        const convertedPosts = blogPosts.map(convertToPostDataType);
        setPosts(convertedPosts);
      } catch (err: any) {
        setError(err.response?.data?.message || "Không thể tải bài viết");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const MAGAZINE1_POSTS = posts.filter((_, i) => i >= 0 && i < 8);
  const LATEST_POSTS = posts.filter((_, i) => i >= 8);

  if (loading) {
    return (
      <div className="nc-BlogPage overflow-hidden relative">
        <Helmet>
          <title>Blog || Fiscondotel</title>
        </Helmet>
        <BgGlassmorphism />
        <div className="container relative">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nc-BlogPage overflow-hidden relative">
      <Helmet>
        <title>Blog || Fiscondotel</title>
      </Helmet>

      <BgGlassmorphism />

      <div className="container relative">
        {error && (
          <div className="pt-12 pb-4">
            <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 rounded-lg">
              {error}
            </div>
          </div>
        )}

        {isAuthenticated && (
          <div className="pt-12 pb-4 flex justify-end">
            <Link
              to="/create-blog-experience"
              className="px-6 py-3 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors font-medium flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Chia sẻ trải nghiệm của bạn
            </Link>
          </div>
        )}

        {MAGAZINE1_POSTS.length > 0 && (
          <div className="pt-12 pb-16 lg:pb-28">
            <SectionMagazine5 posts={MAGAZINE1_POSTS} />
          </div>
        )}

        <SectionAds />

        {LATEST_POSTS.length > 0 && (
          <SectionLatestPosts posts={LATEST_POSTS} className="py-16 lg:py-28" />
        )}

        {posts.length === 0 && !loading && (
          <div className="pt-12 pb-16 lg:pb-28 text-center">
            <p className="text-neutral-600 dark:text-neutral-400">
              Chưa có bài viết nào được xuất bản.
            </p>
          </div>
        )}

        <SectionSubscribe2 className="pb-16 lg:pb-28" />
      </div>
    </div>
  );
};

export default BlogPage;