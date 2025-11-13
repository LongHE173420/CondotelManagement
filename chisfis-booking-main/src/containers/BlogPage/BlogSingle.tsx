import { DEMO_POSTS } from "data/posts";
import { PostDataType } from "data/types";
import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import blogAPI, { BlogPostDetailDTO } from "api/blog";
import Avatar from "shared/Avatar/Avatar";
import Badge from "shared/Badge/Badge";
import ButtonPrimary from "shared/Button/ButtonPrimary";
import ButtonSecondary from "shared/Button/ButtonSecondary";
import Comment from "shared/Comment/Comment";
import NcImage from "shared/NcImage/NcImage";
import SocialsList from "shared/SocialsList/SocialsList";
import Textarea from "shared/Textarea/Textarea";
import { Helmet } from "react-helmet";

const BlogSingle = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostDetailDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadPost = async () => {
      if (!slug) {
        setError("Không tìm thấy bài viết");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const postData = await blogAPI.getPostBySlug(slug);
        if (postData) {
          setPost(postData);
        } else {
          setError("Bài viết không tồn tại hoặc chưa được xuất bản");
        }
      } catch (err: any) {
        console.error("Failed to load blog post:", err);
        setError(err.response?.data?.message || "Không thể tải bài viết");
      } finally {
        setLoading(false);
      }
    };
    loadPost();
  }, [slug]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("vi-VN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const renderHeader = () => {
    if (!post) return null;

    return (
      <header className="container rounded-xl">
        <div className="max-w-screen-md mx-auto space-y-5">
          {post.categoryName && (
            <Badge href={`/blog?category=${post.categoryName}`} color="purple" name={post.categoryName} />
          )}
          <h1
            className=" text-neutral-900 font-semibold text-3xl md:text-4xl md:!leading-[120%] lg:text-4xl dark:text-neutral-100 max-w-4xl "
            title={post.title}
          >
            {post.title}
          </h1>

          <div className="w-full border-b border-neutral-100 dark:border-neutral-800"></div>
          <div className="flex flex-col items-baseline sm:flex-row sm:justify-between">
            <div className="nc-PostMeta2 flex items-center flex-wrap text-neutral-700 text-left dark:text-neutral-200 text-sm leading-none flex-shrink-0">
              <Avatar
                containerClassName="flex-shrink-0"
                sizeClass="w-8 h-8 sm:h-11 sm:w-11 "
                userName={post.authorName || "Admin"}
              />
              <div className="ml-3">
                <div className="flex items-center">
                  <a className="block font-semibold" href="/">
                    {post.authorName || "Admin"}
                  </a>
                </div>
                <div className="text-xs mt-[6px]">
                  <span className="text-neutral-700 dark:text-neutral-300">
                    {formatDate(post.publishedAt)}
                  </span>
                  {post.content && (
                    <>
                      <span className="mx-2 font-semibold">·</span>
                      <span className="text-neutral-700 dark:text-neutral-300">
                        {Math.ceil(post.content.length / 1000)} min read
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-3 sm:mt-0 sm:ml-3">
              <SocialsList />
            </div>
          </div>
        </div>
      </header>
    );
  };

  const renderContent = () => {
    if (!post || !post.content) {
      return (
        <div className="max-w-screen-md mx-auto text-center py-12">
          <p className="text-neutral-600 dark:text-neutral-400">
            Nội dung bài viết không có sẵn.
          </p>
        </div>
      );
    }

    return (
      <div
        id="single-entry-content"
        className="prose dark:prose-invert prose-sm !max-w-screen-md sm:prose lg:prose-lg mx-auto dark:prose-dark"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />
    );
  };

  const renderTags = () => {
    // BlogPostDetailDTO doesn't have tags field, so we return null
    return null;
  };

  const renderAuthor = () => {
    if (!post) return null;

    return (
      <div className="max-w-screen-md mx-auto ">
        <div className="nc-SingleAuthor flex">
          <Avatar 
            sizeClass="w-11 h-11 md:w-24 md:h-24" 
            userName={post.authorName || "Admin"}
          />
          <div className="flex flex-col ml-3 max-w-lg sm:ml-5 space-y-1">
            <span className="text-xs text-neutral-400 uppercase tracking-wider">
              WRITEN BY
            </span>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-200">
              <a href="/">{post.authorName || "Admin"}</a>
            </h2>
          </div>
        </div>
      </div>
    );
  };

  const renderCommentForm = () => {
    return (
      <div className="max-w-screen-md mx-auto pt-5">
        <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200">
          Responses (14)
        </h3>
        <form className="nc-SingleCommentForm mt-5">
          <Textarea />
          <div className="mt-2 space-x-3">
            <ButtonPrimary>Submit</ButtonPrimary>
            <ButtonSecondary>Cancel</ButtonSecondary>
          </div>
        </form>
      </div>
    );
  };

  const renderCommentLists = () => {
    return (
      <div className="max-w-screen-md mx-auto">
        <ul className="nc-SingleCommentLists space-y-5">
          <li>
            <Comment />
            <ul className="pl-4 mt-5 space-y-5 md:pl-11">
              <li>
                <Comment isSmall />
              </li>
            </ul>
          </li>
          <li>
            <Comment />
            <ul className="pl-4 mt-5 space-y-5 md:pl-11">
              <li>
                <Comment isSmall />
              </li>
            </ul>
          </li>
        </ul>
      </div>
    );
  };

  const renderPostRelated = (post: PostDataType) => {
    return (
      <div
        key={post.id}
        className="relative aspect-w-3 aspect-h-4 rounded-3xl overflow-hidden group"
      >
        <Link to={post.href} />
        <NcImage
          className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-300"
          src={post.featuredImage}
        />
        <div>
          <div className="absolute bottom-0 inset-x-0 h-1/2 bg-gradient-to-t from-black"></div>
        </div>
        <div className="flex flex-col justify-end items-start text-xs text-neutral-300 space-y-2.5 p-4">
          <Badge name="Categories" />
          <h2 className="block text-lg font-semibold text-white ">
            <span className="line-clamp-2">{post.title}</span>
          </h2>

          <div className="flex">
            <span className="block text-neutral-200 hover:text-white font-medium truncate">
              {post.author.displayName}
            </span>
            <span className="mx-1.5 font-medium">·</span>
            <span className="font-normal truncate">{post.date}</span>
          </div>
        </div>
        <Link to={post.href} />
      </div>
    );
  };

  if (loading) {
    return (
      <div className="nc-PageSingle pt-8 lg:pt-16 ">
        <Helmet>
          <title>Loading... || Booking React Template</title>
        </Helmet>
        <div className="container">
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="nc-PageSingle pt-8 lg:pt-16 ">
        <Helmet>
          <title>Error || Booking React Template</title>
        </Helmet>
        <div className="container">
          <div className="text-center py-20">
            <p className="text-red-600 dark:text-red-400 text-lg">{error || "Bài viết không tồn tại"}</p>
            <Link to="/blog" className="mt-4 inline-block text-primary-600 hover:text-primary-700">
              ← Quay lại danh sách bài viết
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="nc-PageSingle pt-8 lg:pt-16 ">
      <Helmet>
        <title>{post.title} || Booking React Template</title>
      </Helmet>
      {renderHeader()}
      {post.featuredImageUrl && (
        <NcImage
          className="w-full rounded-xl"
          containerClassName="container my-10 sm:my-12 "
          src={post.featuredImageUrl}
          alt={post.title}
        />
      )}

      <div className="nc-SingleContent container space-y-10">
        {renderContent()}
        {renderTags()}
        <div className="max-w-screen-md mx-auto border-b border-t border-neutral-100 dark:border-neutral-700"></div>
        {renderAuthor()}
        {renderCommentForm()}
        {renderCommentLists()}
      </div>
      <div className="relative bg-neutral-100 dark:bg-neutral-800 py-16 lg:py-28 mt-16 lg:mt-24">
        <div className="container ">
          <h2 className="text-3xl font-semibold">Related posts</h2>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
            {/*  */}
            {DEMO_POSTS.filter((_, i) => i < 4).map(renderPostRelated)}
            {/*  */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogSingle;
