"use client";

import React, { useEffect, useState } from 'react';
import { 
  PlusIcon, SearchIcon, EditIcon, TrashIcon, EyeIcon, 
  ArrowUpIcon, ArrowDownIcon, SaveIcon, XIcon
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArticleProvider } from '@/provider/ArticleProvider';
import { useArticles } from '@/hooks/useArticles';
import { useAuth } from '@/hooks/useAuth';
import { Article, ArticleFormData } from '@/types/article';

function AdminArticlesContent() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    articles,
    categories,
    authors,
    loading,
    fetchArticles,
    fetchCategories,
    fetchAuthors,
    createArticle,
    updateArticle,
    deleteArticle,
  } = useArticles();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<'title' | 'published_at' | 'view_count'>('published_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  // Form state
  const [formData, setFormData] = useState<ArticleFormData>({
    title: '',
    slug: '',
    subtitle: '',
    excerpt: '',
    content: '',
    cover_image: '',
    thumbnail_image: '',
    category_id: '',
    tags: [],
    author_id: '',
    status: 'draft',
    is_published: false,
    is_featured: false,
    featured_priority: 0,
    meta_title: '',
    meta_description: '',
    meta_keywords: [],
    read_time_minutes: 5,
  });

  // Fetch data on mount
  useEffect(() => {
    if (user?.is_admin) {
      fetchArticles();
      fetchCategories();
      fetchAuthors();
    }
  }, [user, fetchArticles, fetchCategories, fetchAuthors]);

  // Redirect if not admin
  useEffect(() => {
    if (!user?.is_admin && !loading) {
      router.push('/admin/login');
    }
  }, [user?.is_admin, loading, router]);

  // Filter and sort articles
  const filteredArticles = articles
    .filter((article) =>
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.excerpt?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      return 0;
    });

  const handleSort = (field: 'title' | 'published_at' | 'view_count') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const handleCreate = () => {
    setFormData({
      title: '',
      slug: '',
      subtitle: '',
      excerpt: '',
      content: '',
      cover_image: '',
      thumbnail_image: '',
      category_id: categories[0]?.id || '',
      tags: [],
      author_id: authors[0]?.id || '',
      status: 'draft',
      is_published: false,
      is_featured: false,
      featured_priority: 0,
      meta_title: '',
      meta_description: '',
      meta_keywords: [],
      read_time_minutes: 5,
    });
    setIsCreating(true);
    setIsEditing(false);
  };

  const handleEdit = (article: Article) => {
    setFormData({
      title: article.title,
      slug: article.slug,
      subtitle: article.subtitle || '',
      excerpt: article.excerpt || '',
      content: article.content,
      cover_image: article.cover_image || '',
      thumbnail_image: article.thumbnail_image || '',
      category_id: article.category_id || '',
      tags: article.tags,
      author_id: article.author_id || '',
      status: article.status,
      is_published: article.is_published,
      is_featured: article.is_featured,
      featured_priority: article.featured_priority,
      meta_title: article.meta_title || '',
      meta_description: article.meta_description || '',
      meta_keywords: article.meta_keywords || [],
      read_time_minutes: article.read_time_minutes || 5,
    });
    setSelectedArticle(article);
    setIsEditing(true);
    setIsCreating(false);
  };

  const handleDelete = (article: Article) => {
    setArticleToDelete(article);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (articleToDelete) {
      const success = await deleteArticle(articleToDelete.id);
      if (success) {
        setDeleteConfirmOpen(false);
        setArticleToDelete(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate slug from title if not provided
    if (!formData.slug) {
      formData.slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }
    
    if (isCreating) {
      const newArticle = await createArticle(formData);
      if (newArticle) {
        setIsCreating(false);
        setFormData({
          title: '',
          slug: '',
          subtitle: '',
          excerpt: '',
          content: '',
          cover_image: '',
          thumbnail_image: '',
          category_id: '',
          tags: [],
          author_id: '',
          status: 'draft',
          is_published: false,
          is_featured: false,
          featured_priority: 0,
          meta_title: '',
          meta_description: '',
          meta_keywords: [],
          read_time_minutes: 5,
        });
      }
    } else if (isEditing && selectedArticle) {
      const updated = await updateArticle(selectedArticle.id, formData);
      if (updated) {
        setIsEditing(false);
        setSelectedArticle(null);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setIsEditing(false);
    setSelectedArticle(null);
  };

  if (!user?.is_admin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You must be an admin to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Article Management</h1>
          <p className="text-gray-600">Create, edit, and manage articles for House of Angels</p>
        </div>

        {/* Create/Edit Form */}
        {(isCreating || isEditing) && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {isCreating ? 'Create New Article' : 'Edit Article'}
              </h2>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Title */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Article title"
                  />
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="article-url-slug (auto-generated if empty)"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <SaveIcon size={20} />
                  {loading ? 'Saving...' : isCreating ? 'Create Article' : 'Update Article'}
                </button>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Articles List */}
        {!isCreating && !isEditing && (
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Toolbar */}
            <div className="p-6 border-b border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="relative flex-1 max-w-md">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleCreate}
                  className="flex items-center gap-2 px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                >
                  <PlusIcon size={20} />
                  Create Article
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <button
                        onClick={() => handleSort('title')}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                      >
                        Title
                        {sortField === 'title' && (
                          sortDirection === 'asc' ? <ArrowUpIcon size={14} /> : <ArrowDownIcon size={14} />
                        )}
                      </button>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        Loading articles...
                      </td>
                    </tr>
                  ) : filteredArticles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                        No articles found
                      </td>
                    </tr>
                  ) : (
                    filteredArticles.map((article) => (
                      <tr key={article.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{article.title}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {article.category?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            {article.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Link
                              href={`/articles/${article.slug}`}
                              target="_blank"
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <EyeIcon size={18} />
                            </Link>
                            <button
                              onClick={() => handleEdit(article)}
                              className="text-teal-600 hover:text-teal-900"
                            >
                              <EditIcon size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(article)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <TrashIcon size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirmOpen && articleToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Article?</h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete "{articleToDelete.title}"? This action cannot be undone.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={confirmDelete}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  onClick={() => {
                    setDeleteConfirmOpen(false);
                    setArticleToDelete(null);
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminArticles() {
  return (
    <ArticleProvider>
      <AdminArticlesContent />
    </ArticleProvider>
  );
}

