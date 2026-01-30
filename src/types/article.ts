// Article Types for House of Angels

export interface ArticleAuthor {
  id: string;
  profile_id?: string;
  name: string;
  bio?: string;
  avatar_url?: string;
  email?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleCategory {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ArticleTag {
  id: string;
  name: string;
  slug: string;
  usage_count: number;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  thumbnail_image?: string;
  category_id?: string;
  tags: string[];
  author_id?: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  is_published: boolean;
  published_at?: string;
  scheduled_publish_at?: string;
  is_featured: boolean;
  featured_priority: number;
  is_trending: boolean;
  trending_score: number;
  view_count: number;
  like_count: number;
  share_count: number;
  comment_count: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  read_time_minutes?: number;
  created_at: string;
  updated_at: string;
  
  // Joined data
  category?: ArticleCategory;
  author?: ArticleAuthor;
}

export interface ArticleView {
  id: string;
  article_id: string;
  viewer_id?: string;
  ip_address?: string;
  user_agent?: string;
  viewed_at: string;
}

export interface ArticleFilters {
  category?: string;
  tag?: string;
  search?: string;
  status?: 'draft' | 'published' | 'archived' | 'scheduled';
  is_featured?: boolean;
  is_trending?: boolean;
}

export interface ArticleFormData {
  title: string;
  slug: string;
  subtitle?: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  thumbnail_image?: string;
  category_id?: string;
  tags: string[];
  author_id?: string;
  status: 'draft' | 'published' | 'archived' | 'scheduled';
  is_published: boolean;
  scheduled_publish_at?: string;
  is_featured: boolean;
  featured_priority: number;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string[];
  read_time_minutes?: number;
}

