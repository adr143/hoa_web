'use client';

import { createContext } from 'react';
import { Article, ArticleCategory, ArticleAuthor, ArticleFilters, ArticleFormData } from '@/types/article';

export interface ArticleContextValue {
  // State
  articles: Article[];
  featuredArticles: Article[];
  trendingArticles: Article[];
  categories: ArticleCategory[];
  authors: ArticleAuthor[];
  loading: boolean;
  error: string | null;
  
  // Fetch functions
  fetchArticles: (filters?: ArticleFilters) => Promise<void>;
  fetchArticleBySlug: (slug: string) => Promise<Article | null>;
  fetchFeaturedArticles: (limit?: number) => Promise<void>;
  fetchTrendingArticles: (limit?: number) => Promise<void>;
  fetchMostViewedArticles: (limit?: number) => Promise<Article[]>;
  fetchCategories: () => Promise<void>;
  fetchAuthors: () => Promise<void>;
  
  // Admin functions
  createArticle: (data: ArticleFormData) => Promise<Article | null>;
  updateArticle: (id: string, data: Partial<ArticleFormData>) => Promise<Article | null>;
  deleteArticle: (id: string) => Promise<boolean>;
  
  // View tracking
  trackArticleView: (articleId: string, userId?: string, ipAddress?: string) => Promise<void>;
  
  // Category management
  createCategory: (data: Partial<ArticleCategory>) => Promise<ArticleCategory | null>;
  updateCategory: (id: string, data: Partial<ArticleCategory>) => Promise<ArticleCategory | null>;
  deleteCategory: (id: string) => Promise<boolean>;
  
  // Author management
  createAuthor: (data: Partial<ArticleAuthor>) => Promise<ArticleAuthor | null>;
  updateAuthor: (id: string, data: Partial<ArticleAuthor>) => Promise<ArticleAuthor | null>;
  deleteAuthor: (id: string) => Promise<boolean>;
}

export const ArticleContext = createContext<ArticleContextValue | undefined>(undefined);

