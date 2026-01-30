'use client';

import React, { ReactNode, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { ArticleContext } from '@/context/ArticleContext';
import { Article, ArticleCategory, ArticleAuthor, ArticleFilters, ArticleFormData } from '@/types/article';

interface ArticleProviderProps {
  children: ReactNode;
}

export const ArticleProvider = ({ children }: ArticleProviderProps) => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [featuredArticles, setFeaturedArticles] = useState<Article[]>([]);
  const [trendingArticles, setTrendingArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<ArticleCategory[]>([]);
  const [authors, setAuthors] = useState<ArticleAuthor[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch articles with filters
  const fetchArticles = useCallback(async (filters?: ArticleFilters) => {
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('articles')
        .select(`
          *,
          category:article_categories(*),
          author:article_authors(*)
        `)
        .eq('is_published', true)
        .order('published_at', { ascending: false });

      // Apply filters
      if (filters?.category) {
        query = query.eq('category_id', filters.category);
      }
      
      if (filters?.tag) {
        query = query.contains('tags', [filters.tag]);
      }
      
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
      }
      
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters?.is_featured !== undefined) {
        query = query.eq('is_featured', filters.is_featured);
      }
      
      if (filters?.is_trending !== undefined) {
        query = query.eq('is_trending', filters.is_trending);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      
      setArticles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch article by slug
  const fetchArticleBySlug = useCallback(async (slug: string): Promise<Article | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          *,
          category:article_categories(*),
          author:article_authors(*)
        `)
        .eq('slug', slug)
        .eq('is_published', true)
        .single();

      if (fetchError) throw fetchError;
      
      return data;
    } catch (err: any) {
      setError(err.message || 'Failed to fetch article');
      console.error('Error fetching article:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch featured articles
  const fetchFeaturedArticles = useCallback(async (limit = 3) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          *,
          category:article_categories(*),
          author:article_authors(*)
        `)
        .eq('is_published', true)
        .eq('is_featured', true)
        .order('featured_priority', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      
      setFeaturedArticles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch featured articles');
      console.error('Error fetching featured articles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch trending articles
  const fetchTrendingArticles = useCallback(async (limit = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          *,
          category:article_categories(*),
          author:article_authors(*)
        `)
        .eq('is_published', true)
        .eq('is_trending', true)
        .order('trending_score', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      
      setTrendingArticles(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trending articles');
      console.error('Error fetching trending articles:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch most viewed articles
  const fetchMostViewedArticles = useCallback(async (limit = 10): Promise<Article[]> => {
    try {
      const { data, error: fetchError } = await supabase
        .from('articles')
        .select(`
          *,
          category:article_categories(*),
          author:article_authors(*)
        `)
        .eq('is_published', true)
        .order('view_count', { ascending: false })
        .limit(limit);

      if (fetchError) throw fetchError;
      
      return data || [];
    } catch (err: any) {
      console.error('Error fetching most viewed articles:', err);
      return [];
    }
  }, []);

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('article_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (fetchError) throw fetchError;
      
      setCategories(data || []);
    } catch (err: any) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  // Fetch authors
  const fetchAuthors = useCallback(async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('article_authors')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (fetchError) throw fetchError;
      
      setAuthors(data || []);
    } catch (err: any) {
      console.error('Error fetching authors:', err);
    }
  }, []);

  // Create article
  const createArticle = useCallback(async (data: ArticleFormData): Promise<Article | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: newArticle, error: createError } = await supabase
        .from('articles')
        .insert([data])
        .select(`
          *,
          category:article_categories(*),
          author:article_authors(*)
        `)
        .single();

      if (createError) throw createError;
      
      // Refresh articles list
      await fetchArticles();
      
      return newArticle;
    } catch (err: any) {
      setError(err.message || 'Failed to create article');
      console.error('Error creating article:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchArticles]);

  // Update article
  const updateArticle = useCallback(async (id: string, data: Partial<ArticleFormData>): Promise<Article | null> => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: updatedArticle, error: updateError } = await supabase
        .from('articles')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          category:article_categories(*),
          author:article_authors(*)
        `)
        .single();

      if (updateError) throw updateError;
      
      // Refresh articles list
      await fetchArticles();
      
      return updatedArticle;
    } catch (err: any) {
      setError(err.message || 'Failed to update article');
      console.error('Error updating article:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [fetchArticles]);

  // Delete article
  const deleteArticle = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      const { error: deleteError } = await supabase
        .from('articles')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      // Refresh articles list
      await fetchArticles();
      
      return true;
    } catch (err: any) {
      setError(err.message || 'Failed to delete article');
      console.error('Error deleting article:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [fetchArticles]);

  // Track article view
  const trackArticleView = useCallback(async (articleId: string, userId?: string, ipAddress?: string) => {
    try {
      // Check if view already exists today (duplicate prevention)
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let query = supabase
        .from('article_views')
        .select('id')
        .eq('article_id', articleId)
        .gte('viewed_at', today.toISOString());

      if (userId) {
        query = query.eq('viewer_id', userId);
      } else if (ipAddress) {
        query = query.eq('ip_address', ipAddress);
      }

      const { data: existingView } = await query.single();

      // If view already exists today, don't track again
      if (existingView) {
        return;
      }

      // Insert view record
      await supabase.from('article_views').insert({
        article_id: articleId,
        viewer_id: userId || null,
        ip_address: ipAddress || null,
        user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null
      });

      // Increment view count
      await supabase.rpc('increment_article_views', { article_uuid: articleId });
    } catch (err: any) {
      console.error('Error tracking article view:', err);
    }
  }, []);

  // Create category
  const createCategory = useCallback(async (data: Partial<ArticleCategory>): Promise<ArticleCategory | null> => {
    try {
      const { data: newCategory, error: createError } = await supabase
        .from('article_categories')
        .insert([data])
        .select('*')
        .single();

      if (createError) throw createError;
      
      await fetchCategories();
      return newCategory;
    } catch (err: any) {
      console.error('Error creating category:', err);
      return null;
    }
  }, [fetchCategories]);

  // Update category
  const updateCategory = useCallback(async (id: string, data: Partial<ArticleCategory>): Promise<ArticleCategory | null> => {
    try {
      const { data: updatedCategory, error: updateError } = await supabase
        .from('article_categories')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;
      
      await fetchCategories();
      return updatedCategory;
    } catch (err: any) {
      console.error('Error updating category:', err);
      return null;
    }
  }, [fetchCategories]);

  // Delete category
  const deleteCategory = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('article_categories')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      await fetchCategories();
      return true;
    } catch (err: any) {
      console.error('Error deleting category:', err);
      return false;
    }
  }, [fetchCategories]);

  // Create author
  const createAuthor = useCallback(async (data: Partial<ArticleAuthor>): Promise<ArticleAuthor | null> => {
    try {
      const { data: newAuthor, error: createError } = await supabase
        .from('article_authors')
        .insert([data])
        .select('*')
        .single();

      if (createError) throw createError;
      
      await fetchAuthors();
      return newAuthor;
    } catch (err: any) {
      console.error('Error creating author:', err);
      return null;
    }
  }, [fetchAuthors]);

  // Update author
  const updateAuthor = useCallback(async (id: string, data: Partial<ArticleAuthor>): Promise<ArticleAuthor | null> => {
    try {
      const { data: updatedAuthor, error: updateError } = await supabase
        .from('article_authors')
        .update(data)
        .eq('id', id)
        .select('*')
        .single();

      if (updateError) throw updateError;
      
      await fetchAuthors();
      return updatedAuthor;
    } catch (err: any) {
      console.error('Error updating author:', err);
      return null;
    }
  }, [fetchAuthors]);

  // Delete author
  const deleteAuthor = useCallback(async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('article_authors')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      
      await fetchAuthors();
      return true;
    } catch (err: any) {
      console.error('Error deleting author:', err);
      return false;
    }
  }, [fetchAuthors]);

  const value = {
    articles,
    featuredArticles,
    trendingArticles,
    categories,
    authors,
    loading,
    error,
    fetchArticles,
    fetchArticleBySlug,
    fetchFeaturedArticles,
    fetchTrendingArticles,
    fetchMostViewedArticles,
    fetchCategories,
    fetchAuthors,
    createArticle,
    updateArticle,
    deleteArticle,
    trackArticleView,
    createCategory,
    updateCategory,
    deleteCategory,
    createAuthor,
    updateAuthor,
    deleteAuthor,
  };

  return React.createElement(ArticleContext.Provider, { value }, children);
};

