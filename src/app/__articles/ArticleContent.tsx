"use client";

import React, { useEffect, useState } from "react";
import { Search, Clock, TrendingUp, Star, Eye } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useArticles } from "@/hooks/useArticles";
import { Article } from "@/types/article";

export function ArticlesContent() {
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") || "";
  const categoryParam = searchParams.get("category") || "";

  const {
    articles,
    featuredArticles,
    trendingArticles,
    categories,
    loading,
    fetchArticles,
    fetchFeaturedArticles,
    fetchTrendingArticles,
    fetchCategories,
  } = useArticles();

  const [activeCategory, setActiveCategory] = useState(categoryParam || "all");
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [filteredArticles, setFilteredArticles] = useState<Article[]>([]);

  // Fetch initial data
  useEffect(() => {
    fetchCategories();
    fetchFeaturedArticles(3);
    fetchTrendingArticles(5);
  }, [fetchCategories, fetchFeaturedArticles, fetchTrendingArticles]);

  // Fetch articles when filters change
  useEffect(() => {
    const filters: Record<string, string | number> = {};
    
    if (activeCategory && activeCategory !== "all") {
      const selectedCategory = categories.find(c => c.slug === activeCategory);
      if (selectedCategory) {
        filters.category = selectedCategory.id;
      }
    }
    
    if (searchTerm) {
      filters.search = searchTerm;
    }
    
    fetchArticles(filters);
  }, [activeCategory, searchTerm, categories, fetchArticles]);

  // Filter articles locally for immediate feedback
  useEffect(() => {
    let filtered = articles;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(term) ||
          a.excerpt?.toLowerCase().includes(term)
      );
    }
    
    setFilteredArticles(filtered);
  }, [articles, searchTerm]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Search is handled by useEffect
  };

  const handleCategoryChange = (categorySlug: string) => {
    setActiveCategory(categorySlug);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-blue-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Articles & Resources
          </h1>
          <p className="text-xl text-teal-100 max-w-2xl">
            Expert advice, success stories, and guides for employers and workers
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Featured Articles */}
        {featuredArticles.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Star className="text-yellow-500" size={24} />
              <h2 className="text-3xl font-bold text-gray-900">
                Featured Articles
              </h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {featuredArticles.map((article) => (
                <Link
                  key={article.id}
                  href={`/articles/${article.slug}`}
                  className="group"
                >
                  <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={article.cover_image || "https://via.placeholder.com/800x400"}
                        alt={article.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-yellow-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                          <Star size={14} /> Featured
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      {article.category && (
                        <span
                          className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                          style={{
                            backgroundColor: article.category.color + "20",
                            color: article.category.color,
                          }}
                        >
                          {article.category.name}
                        </span>
                      )}
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center gap-4">
                          {article.author && (
                            <div className="flex items-center gap-2">
                              <img
                                src={article.author.avatar_url || "https://via.placeholder.com/40"}
                                alt={article.author.name}
                                className="w-6 h-6 rounded-full"
                              />
                              <span>{article.author.name}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {article.read_time_minutes && (
                            <span className="flex items-center gap-1">
                              <Clock size={14} /> {article.read_time_minutes} min
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Eye size={14} /> {article.view_count}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-md p-6 mb-8">
              <form onSubmit={handleSearch} className="mb-6">
                <div className="relative">
                  <Search
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={20}
                  />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
              </form>

              {/* Category Filters */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange("all")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    activeCategory === "all"
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Articles
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryChange(cat.slug)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      activeCategory === cat.slug
                        ? "bg-teal-500 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Articles Grid */}
            {loading ? (
              <div className="grid md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
                  >
                    <div className="h-48 bg-gray-200"></div>
                    <div className="p-6 space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-200 rounded"></div>
                      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <p className="text-gray-500 text-lg">
                  No articles found. Try adjusting your filters.
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    href={`/articles/${article.slug}`}
                    className="group"
                  >
                    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={article.cover_image || "https://via.placeholder.com/800x400"}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {article.is_trending && (
                          <div className="absolute top-4 right-4">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
                              <TrendingUp size={14} /> Trending
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="p-6">
                        {article.category && (
                          <span
                            className="inline-block px-3 py-1 rounded-full text-sm font-semibold mb-3"
                            style={{
                              backgroundColor: article.category.color + "20",
                              color: article.category.color,
                            }}
                          >
                            {article.category.name}
                          </span>
                        )}
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-teal-600 transition-colors">
                          {article.title}
                        </h3>
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          {article.author && (
                            <div className="flex items-center gap-2">
                              <img
                                src={article.author.avatar_url || "https://via.placeholder.com/40"}
                                alt={article.author.name}
                                className="w-6 h-6 rounded-full"
                              />
                              <span>{article.author.name}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            {article.read_time_minutes && (
                              <span className="flex items-center gap-1">
                                <Clock size={14} /> {article.read_time_minutes} min
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Eye size={14} /> {article.view_count}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Trending Articles */}
            {trendingArticles.length > 0 && (
              <div className="bg-white rounded-xl shadow-md p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="text-red-500" size={20} />
                  <h3 className="text-xl font-bold text-gray-900">
                    Trending Now
                  </h3>
                </div>
                <div className="space-y-4">
                  {trendingArticles.map((article, index) => (
                    <Link
                      key={article.id}
                      href={`/articles/${article.slug}`}
                      className="block group"
                    >
                      <div className="flex gap-3">
                        <span className="text-2xl font-bold text-gray-300 group-hover:text-teal-500 transition-colors">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 group-hover:text-teal-600 transition-colors line-clamp-2 mb-1">
                            {article.title}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Eye size={12} /> {article.view_count} views
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}