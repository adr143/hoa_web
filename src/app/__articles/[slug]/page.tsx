"use client";

import React, { useEffect, useState } from "react";
import {
  ClockIcon,
  TagIcon,
  ShareIcon,
  BookmarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { useArticles } from "@/hooks/useArticles";
import { Article } from "@/types/article";

export default function ArticleDetail() {
  const { slug } = useParams();
  const router = useRouter();
  const { featuredArticles, fetchArticleBySlug, fetchFeaturedArticles } = useArticles();

  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedArticles, setRelatedArticles] = useState<Article[]>([]);

  useEffect(() => {
    const loadArticle = async () => {
      setLoading(true);
      try {
        const fetchedArticle = await fetchArticleBySlug(slug as string);
        setArticle(fetchedArticle);
      } finally {
        setLoading(false);
      }
    };
    loadArticle();
  }, [slug, fetchArticleBySlug]);

  useEffect(() => {
    fetchFeaturedArticles(3);
  }, [fetchFeaturedArticles]);

  useEffect(() => {
    setRelatedArticles(featuredArticles);
  }, [featuredArticles]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 w-3/4 rounded"></div>
          <div className="h-4 bg-gray-200 w-1/2 rounded"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Article Not Found</h2>
        <p className="text-gray-600 mb-6">
          The article you’re looking for doesn’t exist or has been removed.
        </p>
        <Link
          href="/articles"
          className="bg-teal-500 text-white px-6 py-2 rounded-md hover:bg-teal-600"
        >
          Browse Articles
        </Link>
      </div>
    );
  }

  const breadcrumbItems: Array<{ label: string; path: string }> = [
    { label: "Articles", path: "/articles" },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <Breadcrumbs items={breadcrumbItems} currentPageLabel={article.title} />

        <article className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="relative h-96">
            <img
              src={article.cover_image || '/placeholder-article.jpg'}
              alt={article.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
              <div className="p-8 text-white">
                <div className="mb-4">
                  <Link
                    href={`/articles`}
                    className="bg-teal-500 text-sm px-3 py-1 rounded-full hover:bg-teal-600"
                  >
                    {article.category?.name || 'Article'}
                  </Link>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  {article.title}
                </h1>
                {article.subtitle && (
                  <p className="text-white/90 text-lg">{article.subtitle}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between">
              <div className="flex items-center mb-4 sm:mb-0">
                {article.author && (
                  <>
                    <img
                      src={article.author.avatar_url || '/placeholder-avatar.jpg'}
                      alt={article.author.name}
                      className="w-12 h-12 rounded-full mr-4"
                    />
                    <div>
                      <p className="font-medium text-gray-800">
                        {article.author.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(article.published_at || article.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <span className="text-gray-500 text-sm flex items-center">
                  <ClockIcon size={16} className="mr-1" /> {article.read_time_minutes || 5} min read
                </span>
                <button className="text-gray-500 hover:text-gray-700">
                  <ShareIcon size={18} />
                </button>
                <button className="text-gray-500 hover:text-gray-700">
                  <BookmarkIcon size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Tags */}
            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex flex-wrap gap-2 items-center">
                <span className="font-medium text-gray-700">Tags:</span>
                {article.tags.map((tag: string, index: number) => (
                  <Link
                    key={index}
                    href={`/articles/tag/${tag}`}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center"
                  >
                    <TagIcon size={14} className="mr-1" /> {tag}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">
            Related Articles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {relatedArticles.map((related) => (
              <div
                key={related.id}
                className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition"
              >
                <div className="h-40 overflow-hidden">
                  <img
                    src={related.cover_image || '/placeholder-article.jpg'}
                    alt={related.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <span className="text-xs text-gray-500 block mb-2">
                    {new Date(related.published_at || related.created_at).toLocaleDateString()}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 line-clamp-2">
                    {related.title}
                  </h3>
                  <Link
                    href={`/articles/${related.slug}`}
                    className="text-teal-500 text-sm font-medium hover:text-teal-600"
                  >
                    Read Article →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-12 flex justify-between">
          <button
            onClick={() => {
              try {
                router.back();
              } catch (error) {
                console.error('Failed to navigate back:', error);
              }
            }}
            className="flex items-center text-gray-600 hover:text-teal-500"
          >
            <ChevronLeftIcon size={20} className="mr-1" /> Back
          </button>
          <Link
            href="/articles"
            className="flex items-center text-gray-600 hover:text-teal-500"
          >
            View All Articles
            <ChevronRightIcon size={20} className="ml-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
