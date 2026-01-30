# 📰 Articles System - House of Angels

## Overview

The Articles System is a comprehensive content management solution for House of Angels, featuring:
- ✅ **Featured Articles** - Highlight important content with priority ordering
- ✅ **Trending Articles** - Automatic trending calculation based on views and recency
- ✅ **Most Viewed** - Track and display popular content
- ✅ **Categories & Tags** - Organize content effectively
- ✅ **View Tracking** - Analytics for article performance
- ✅ **SEO Optimization** - Meta tags and descriptions
- ✅ **Scheduled Publishing** - Plan content releases
- ✅ **Author Management** - Multiple authors with profiles

---

## 📁 Files Created

### 1. **`supabase_articles_system.sql`**
Main database schema with:
- 5 tables (articles, authors, categories, tags, views)
- Indexes for performance
- Functions for trending calculation
- Triggers for automation
- RLS policies for security

### 2. **`supabase_articles_placeholder_data.sql`**
Test data including:
- 6 sample authors
- 6 categories
- 20 articles (3 featured, 5 trending)
- 70+ tags
- 485+ sample views

---

## 🗄️ Database Schema

### Tables

#### **1. article_authors**
```sql
- id (UUID, PK)
- profile_id (UUID, FK to profiles)
- name (TEXT)
- bio (TEXT)
- avatar_url (TEXT)
- email (TEXT)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### **2. article_categories**
```sql
- id (UUID, PK)
- slug (TEXT, UNIQUE)
- name (TEXT)
- description (TEXT)
- icon (TEXT)
- color (TEXT)
- display_order (INTEGER)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

#### **3. articles**
```sql
- id (UUID, PK)
- title, slug, subtitle, excerpt, content (TEXT)
- cover_image, thumbnail_image (TEXT)
- category_id (UUID, FK)
- tags (TEXT[])
- author_id (UUID, FK)
- status (draft/published/archived/scheduled)
- is_published (BOOLEAN)
- published_at, scheduled_publish_at (TIMESTAMPTZ)
- is_featured (BOOLEAN)
- featured_priority (INTEGER)
- is_trending (BOOLEAN)
- trending_score (NUMERIC)
- view_count, like_count, share_count, comment_count (INTEGER)
- meta_title, meta_description, meta_keywords (TEXT/TEXT[])
- read_time_minutes (INTEGER)
- created_at, updated_at (TIMESTAMPTZ)
```

#### **4. article_tags**
```sql
- id (UUID, PK)
- name, slug (TEXT, UNIQUE)
- usage_count (INTEGER)
- created_at (TIMESTAMPTZ)
```

#### **5. article_views**
```sql
- id (UUID, PK)
- article_id (UUID, FK)
- viewer_id (UUID, FK to profiles, nullable)
- ip_address (TEXT)
- user_agent (TEXT)
- viewed_at (TIMESTAMPTZ)
- UNIQUE constraints to prevent duplicate counting
```

---

## 🔧 Key Functions

### **1. `increment_article_views(article_uuid UUID)`**
Increments the view count for an article.

```sql
SELECT increment_article_views('article-uuid-here');
```

### **2. `calculate_trending_score(article_uuid UUID)`**
Calculates trending score based on:
- Recent views (last 7 days) - 70% weight
- Total views - 20% weight
- Article recency - 10% weight

```sql
SELECT calculate_trending_score('article-uuid-here');
```

### **3. `update_trending_articles()`**
Updates trending scores for all published articles and marks top 10 as trending.

```sql
SELECT update_trending_articles();
```

**Recommended:** Run this function periodically (e.g., every hour) using a cron job.

### **4. `publish_scheduled_articles()`**
Auto-publishes articles that are scheduled for the current time.

```sql
SELECT publish_scheduled_articles();
```

**Recommended:** Run this function every 5-15 minutes using a cron job.

---

## 🚀 Setup Instructions

### Step 1: Run the Schema Script

In your Supabase SQL Editor:

```sql
-- Run the main schema script
-- Copy and paste contents of supabase_articles_system.sql
```

This creates all tables, indexes, functions, triggers, and RLS policies.

### Step 2: Insert Placeholder Data (Optional)

For testing purposes:

```sql
-- Run the placeholder data script
-- Copy and paste contents of supabase_articles_placeholder_data.sql
```

This populates the database with 20 sample articles.

### Step 3: Set Up Cron Jobs (Recommended)

In Supabase Dashboard → Database → Cron Jobs:

**Update Trending Articles (Every Hour):**
```sql
SELECT cron.schedule(
  'update-trending-articles',
  '0 * * * *', -- Every hour
  $$SELECT update_trending_articles()$$
);
```

**Publish Scheduled Articles (Every 15 Minutes):**
```sql
SELECT cron.schedule(
  'publish-scheduled-articles',
  '*/15 * * * *', -- Every 15 minutes
  $$SELECT publish_scheduled_articles()$$
);
```

---

## 📊 Usage Examples

### Fetch Featured Articles

```typescript
const { data: featured } = await supabase
  .from('articles')
  .select(`
    *,
    category:article_categories(*),
    author:article_authors(*)
  `)
  .eq('is_published', true)
  .eq('is_featured', true)
  .order('featured_priority', { ascending: false })
  .limit(3);
```

### Fetch Trending Articles

```typescript
const { data: trending } = await supabase
  .from('articles')
  .select(`
    *,
    category:article_categories(*),
    author:article_authors(*)
  `)
  .eq('is_published', true)
  .eq('is_trending', true)
  .order('trending_score', { ascending: false })
  .limit(10);
```

### Fetch Most Viewed Articles

```typescript
const { data: mostViewed } = await supabase
  .from('articles')
  .select(`
    *,
    category:article_categories(*),
    author:article_authors(*)
  `)
  .eq('is_published', true)
  .order('view_count', { ascending: false })
  .limit(10);
```

### Fetch Articles by Category

```typescript
const { data: articles } = await supabase
  .from('articles')
  .select(`
    *,
    category:article_categories(*),
    author:article_authors(*)
  `)
  .eq('is_published', true)
  .eq('category_id', 'category-uuid-here')
  .order('published_at', { ascending: false });
```

### Search Articles

```typescript
const { data: results } = await supabase
  .from('articles')
  .select(`
    *,
    category:article_categories(*),
    author:article_authors(*)
  `)
  .eq('is_published', true)
  .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
  .order('published_at', { ascending: false });
```

### Track Article View

```typescript
// Insert view record
await supabase.from('article_views').insert({
  article_id: articleId,
  viewer_id: userId || null, // null for anonymous
  ip_address: userIp,
  user_agent: navigator.userAgent
});

// Increment view count
await supabase.rpc('increment_article_views', { article_uuid: articleId });
```

---

## 🎨 Frontend Integration

### Article Card Component

```typescript
interface ArticleCardProps {
  article: {
    id: string;
    title: string;
    excerpt: string;
    cover_image: string;
    category: { name: string; color: string };
    author: { name: string; avatar_url: string };
    published_at: string;
    read_time_minutes: number;
    view_count: number;
    is_featured?: boolean;
    is_trending?: boolean;
  };
}

function ArticleCard({ article }: ArticleCardProps) {
  return (
    <div className="article-card">
      {article.is_featured && <span className="badge">Featured</span>}
      {article.is_trending && <span className="badge">Trending</span>}
      <img src={article.cover_image} alt={article.title} />
      <span style={{ color: article.category.color }}>
        {article.category.name}
      </span>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <div className="meta">
        <img src={article.author.avatar_url} alt={article.author.name} />
        <span>{article.author.name}</span>
        <span>{article.read_time_minutes} min read</span>
        <span>{article.view_count} views</span>
      </div>
    </div>
  );
}
```

---

## 🔐 Security (RLS Policies)

### Public Access
- ✅ View published articles
- ✅ View active authors
- ✅ View active categories
- ✅ View tags
- ✅ Create article views (for tracking)

### Admin Access
- ✅ Full CRUD on all tables
- ✅ Manage drafts and scheduled posts
- ✅ View all analytics

---

## 📈 Analytics Queries

### Most Popular Articles (Last 30 Days)

```sql
SELECT 
  a.title,
  a.view_count,
  COUNT(av.id) as recent_views
FROM articles a
LEFT JOIN article_views av ON av.article_id = a.id 
  AND av.viewed_at > NOW() - INTERVAL '30 days'
WHERE a.is_published = TRUE
GROUP BY a.id, a.title, a.view_count
ORDER BY recent_views DESC
LIMIT 10;
```

### Category Performance

```sql
SELECT 
  c.name,
  COUNT(a.id) as article_count,
  SUM(a.view_count) as total_views,
  AVG(a.view_count) as avg_views
FROM article_categories c
LEFT JOIN articles a ON a.category_id = c.id AND a.is_published = TRUE
GROUP BY c.id, c.name
ORDER BY total_views DESC;
```

### Author Performance

```sql
SELECT 
  au.name,
  COUNT(a.id) as article_count,
  SUM(a.view_count) as total_views,
  SUM(a.like_count) as total_likes
FROM article_authors au
LEFT JOIN articles a ON a.author_id = au.id AND a.is_published = TRUE
GROUP BY au.id, au.name
ORDER BY total_views DESC;
```

---

## 🎯 Best Practices

### For Content Creators

1. **Use Featured Wisely** - Only feature 3-5 most important articles
2. **Set Featured Priority** - Higher numbers appear first (100, 90, 85, etc.)
3. **Optimize Images** - Use 1200x630px for cover images
4. **Write Good Excerpts** - 150-200 characters for best display
5. **Add Meta Tags** - Improve SEO with proper meta descriptions
6. **Calculate Read Time** - ~200 words per minute average

### For Developers

1. **Cache Aggressively** - Articles don't change often
2. **Lazy Load Images** - Improve page load times
3. **Track Views Properly** - Prevent duplicate counting
4. **Update Trending Regularly** - Run cron job every hour
5. **Index Search** - Consider full-text search for large datasets

---

## 🔄 Maintenance

### Regular Tasks

**Daily:**
- Monitor trending articles
- Check for scheduled publications

**Weekly:**
- Review analytics
- Update featured articles if needed
- Clean up old draft articles

**Monthly:**
- Archive old articles if needed
- Review and update categories/tags
- Analyze author performance

---

## 📝 Sample Data Summary

The placeholder data includes:

- **6 Authors** - Diverse expertise areas
- **6 Categories** - Guides, Tips, Stories, News, Safety, Legal
- **20 Articles** - Various topics and dates
  - 3 Featured (high priority)
  - 5 Trending (recent high engagement)
  - 12 Regular articles
- **70+ Tags** - Comprehensive tagging
- **485+ Views** - Realistic analytics data

---

## 🚀 Next Steps

1. ✅ Run the SQL scripts in Supabase
2. ✅ Set up cron jobs for automation
3. ✅ Update frontend to fetch from database
4. ✅ Create admin interface for article management
5. ✅ Implement article editor (rich text)
6. ✅ Add comment system (optional)
7. ✅ Add like/share functionality
8. ✅ Implement full-text search

---

## 📞 Support

For questions or issues with the articles system, refer to:
- Supabase documentation
- This README
- Database schema comments

---

**The articles system is now ready for production use!** 🎉

