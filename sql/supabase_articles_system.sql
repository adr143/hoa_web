-- ============================================================================
-- ARTICLES SYSTEM FOR HOUSE OF ANGELS
-- ============================================================================
-- This script creates a comprehensive articles/blog system with:
-- - Articles table with rich metadata
-- - Featured, trending, and most viewed tracking
-- - Categories and tags
-- - Author management
-- - View tracking
-- - RLS policies for security
-- ============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS article_views CASCADE;
DROP TABLE IF EXISTS article_tags CASCADE;
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS article_categories CASCADE;
DROP TABLE IF EXISTS article_authors CASCADE;

-- ============================================================================
-- 1. ARTICLE AUTHORS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_authors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. ARTICLE CATEGORIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. ARTICLES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Basic Info
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  subtitle TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  
  -- Media
  cover_image TEXT,
  thumbnail_image TEXT,
  
  -- Categorization
  category_id UUID REFERENCES article_categories(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  
  -- Author
  author_id UUID REFERENCES article_authors(id) ON DELETE SET NULL,
  
  -- Status & Visibility
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'scheduled')),
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  scheduled_publish_at TIMESTAMPTZ,
  
  -- Featured & Trending
  is_featured BOOLEAN DEFAULT FALSE,
  featured_priority INTEGER DEFAULT 0, -- Higher number = higher priority
  is_trending BOOLEAN DEFAULT FALSE,
  trending_score NUMERIC DEFAULT 0, -- Calculated based on views, recency, etc.
  
  -- Engagement Metrics
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  
  -- SEO
  meta_title TEXT,
  meta_description TEXT,
  meta_keywords TEXT[],
  
  -- Reading Time
  read_time_minutes INTEGER, -- Estimated reading time
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for performance
  CONSTRAINT valid_featured_priority CHECK (featured_priority >= 0),
  CONSTRAINT valid_trending_score CHECK (trending_score >= 0)
);

-- ============================================================================
-- 4. ARTICLE TAGS TABLE (for tag management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. ARTICLE VIEWS TABLE (for tracking individual views)
-- ============================================================================
CREATE TABLE IF NOT EXISTS article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for anonymous
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Articles indexes
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON articles(is_featured, featured_priority DESC);
CREATE INDEX IF NOT EXISTS idx_articles_trending ON articles(is_trending, trending_score DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category_id);
CREATE INDEX IF NOT EXISTS idx_articles_author ON articles(author_id);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_tags ON articles USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_articles_view_count ON articles(view_count DESC);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Article views indexes
CREATE INDEX IF NOT EXISTS idx_article_views_article ON article_views(article_id);
CREATE INDEX IF NOT EXISTS idx_article_views_viewer ON article_views(viewer_id);
CREATE INDEX IF NOT EXISTS idx_article_views_date ON article_views(viewed_at);

-- Composite indexes for duplicate prevention queries
CREATE INDEX IF NOT EXISTS idx_article_views_viewer_date
  ON article_views(article_id, viewer_id, viewed_at)
  WHERE viewer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_article_views_ip_date
  ON article_views(article_id, ip_address, viewed_at)
  WHERE ip_address IS NOT NULL;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update article view count
CREATE OR REPLACE FUNCTION increment_article_views(article_uuid UUID)
RETURNS void AS $$
BEGIN
  UPDATE articles 
  SET view_count = view_count + 1,
      updated_at = NOW()
  WHERE id = article_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate trending score
-- Based on: recent views (70%), total views (20%), recency (10%)
CREATE OR REPLACE FUNCTION calculate_trending_score(article_uuid UUID)
RETURNS NUMERIC AS $$
DECLARE
  recent_views INTEGER;
  total_views INTEGER;
  days_old INTEGER;
  score NUMERIC;
BEGIN
  -- Get views in last 7 days
  SELECT COUNT(*) INTO recent_views
  FROM article_views
  WHERE article_id = article_uuid
    AND viewed_at > NOW() - INTERVAL '7 days';
  
  -- Get total views
  SELECT view_count INTO total_views
  FROM articles
  WHERE id = article_uuid;
  
  -- Get article age in days
  SELECT EXTRACT(DAY FROM NOW() - created_at) INTO days_old
  FROM articles
  WHERE id = article_uuid;
  
  -- Calculate score (normalize to 0-100)
  score := (recent_views * 0.7) + (total_views * 0.2 * 0.1) + (GREATEST(0, 30 - days_old) * 0.1);
  
  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- Function to update trending articles (run periodically)
CREATE OR REPLACE FUNCTION update_trending_articles()
RETURNS void AS $$
BEGIN
  -- Update trending scores for all published articles
  UPDATE articles
  SET trending_score = calculate_trending_score(id),
      updated_at = NOW()
  WHERE is_published = TRUE;
  
  -- Mark top 10 as trending
  UPDATE articles
  SET is_trending = FALSE;
  
  UPDATE articles
  SET is_trending = TRUE
  WHERE id IN (
    SELECT id
    FROM articles
    WHERE is_published = TRUE
    ORDER BY trending_score DESC
    LIMIT 10
  );
END;
$$ LANGUAGE plpgsql;

-- Function to auto-publish scheduled articles
CREATE OR REPLACE FUNCTION publish_scheduled_articles()
RETURNS void AS $$
BEGIN
  UPDATE articles
  SET status = 'published',
      is_published = TRUE,
      published_at = NOW(),
      updated_at = NOW()
  WHERE status = 'scheduled'
    AND scheduled_publish_at <= NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_article_authors_updated_at
  BEFORE UPDATE ON article_authors
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to set published_at when article is published
CREATE OR REPLACE FUNCTION set_published_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_published = TRUE AND OLD.is_published = FALSE THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_article_published_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION set_published_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_authors ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE article_views ENABLE ROW LEVEL SECURITY;

-- Articles Policies
-- Public can view published articles
CREATE POLICY "Public can view published articles"
  ON articles FOR SELECT
  USING (is_published = TRUE AND status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can manage all articles"
  ON articles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Article Authors Policies
CREATE POLICY "Public can view active authors"
  ON article_authors FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage authors"
  ON article_authors FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Article Categories Policies
CREATE POLICY "Public can view active categories"
  ON article_categories FOR SELECT
  USING (is_active = TRUE);

CREATE POLICY "Admins can manage categories"
  ON article_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Article Tags Policies
CREATE POLICY "Public can view tags"
  ON article_tags FOR SELECT
  USING (TRUE);

CREATE POLICY "Admins can manage tags"
  ON article_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Article Views Policies
CREATE POLICY "Anyone can create article views"
  ON article_views FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Users can view their own views"
  ON article_views FOR SELECT
  USING (viewer_id = auth.uid() OR viewer_id IS NULL);

CREATE POLICY "Admins can view all views"
  ON article_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- Tables Created:
-- 1. article_authors - Manages article authors
-- 2. article_categories - Article categories with metadata
-- 3. articles - Main articles table with rich features
-- 4. article_tags - Tag management
-- 5. article_views - Individual view tracking
--
-- Features:
-- - Featured articles with priority
-- - Trending articles with automatic scoring
-- - View tracking and analytics
-- - SEO optimization fields
-- - Scheduled publishing
-- - Draft/Published/Archived status
-- - Tag and category management
-- - RLS policies for security
-- ============================================================================

