/*
 * Knowledge Base System
 * ====================
 * This file contains tables related to the internal knowledge base system.
 * The knowledge base allows organizations to create, manage, and share
 * internal documentation and customer-facing articles.
 * 
 * Key Features:
 * - Article versioning
 * - Tag-based organization
 * - Access control per article
 * - Rich metadata support
 */

-- Knowledge Articles Table
-- =======================
-- Main table for knowledge base articles
CREATE TABLE public.knowledge_articles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    author_id UUID REFERENCES profiles,
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'published', 'archived')),
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    metadata JSONB DEFAULT '{}'::jsonb,
    is_public BOOLEAN DEFAULT false  -- If true, visible to customers
);

COMMENT ON TABLE public.knowledge_articles IS 'Knowledge base articles for internal and customer documentation';
COMMENT ON COLUMN knowledge_articles.is_public IS 'Controls visibility to customers';
COMMENT ON COLUMN knowledge_articles.metadata IS 'Flexible JSON storage for article metadata';

-- Example metadata structure:
/*
{
    "seo": {
        "keywords": ["login", "authentication"],
        "description": "Guide for logging into the system"
    },
    "readingTime": "5 minutes",
    "category": "Getting Started",
    "lastReviewed": "2024-01-22T00:00:00Z",
    "reviewedBy": "agent-uuid",
    "versions": [
        {
            "version": "1.0",
            "publishedAt": "2024-01-01T00:00:00Z",
            "changes": "Initial version"
        }
    ],
    "relatedArticles": ["article-uuid-1", "article-uuid-2"]
}
*/

-- Article Categories Table
-- =======================
-- Optional categorization for articles
CREATE TABLE public.article_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES article_categories,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(organization_id, name)
);

COMMENT ON TABLE public.article_categories IS 'Hierarchical categories for knowledge articles';

-- Article Feedback Table
-- =====================
-- Tracks user feedback on articles
CREATE TABLE public.article_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES knowledge_articles NOT NULL,
    user_id UUID REFERENCES profiles,  -- Optional, for anonymous feedback
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb
);

COMMENT ON TABLE public.article_feedback IS 'User feedback and ratings for knowledge articles';

-- Article Views Table
-- ==================
-- Tracks article view statistics
CREATE TABLE public.article_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    article_id UUID REFERENCES knowledge_articles NOT NULL,
    user_id UUID REFERENCES profiles,  -- Optional, for anonymous views
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb  -- Store user agent, etc.
);

COMMENT ON TABLE public.article_views IS 'Tracks article view statistics';

-- Indexes
-- =======
CREATE INDEX idx_knowledge_articles_org ON knowledge_articles(organization_id);
CREATE INDEX idx_knowledge_articles_author ON knowledge_articles(author_id);
CREATE INDEX idx_knowledge_articles_status ON knowledge_articles(status);
CREATE INDEX idx_knowledge_articles_tags ON knowledge_articles USING gin(tags);
CREATE INDEX idx_knowledge_articles_metadata ON knowledge_articles USING gin(metadata jsonb_path_ops);
CREATE INDEX idx_article_categories_org ON article_categories(organization_id);
CREATE INDEX idx_article_categories_parent ON article_categories(parent_id);
CREATE INDEX idx_article_feedback_article ON article_feedback(article_id);
CREATE INDEX idx_article_views_article ON article_views(article_id);

-- Row Level Security
-- =================

-- Knowledge Articles RLS
ALTER TABLE public.knowledge_articles ENABLE ROW LEVEL SECURITY;

-- Articles viewable by organization members and customers (if public)
CREATE POLICY "Articles viewable by organization members and customers" 
    ON knowledge_articles FOR SELECT 
    USING (
        (organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        ))
        OR (
            is_public = true 
            AND status = 'published'
            AND EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() 
                AND role = 'customer'
            )
        )
    );

-- Articles editable by agents and admins
CREATE POLICY "Articles editable by agents and admins" 
    ON knowledge_articles FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND organization_id = knowledge_articles.organization_id
            AND role IN ('agent', 'admin')
        )
    );

-- Categories RLS
ALTER TABLE public.article_categories ENABLE ROW LEVEL SECURITY;

-- Categories viewable by organization members
CREATE POLICY "Categories viewable by organization members" 
    ON article_categories FOR SELECT 
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Categories manageable by agents and admins
CREATE POLICY "Categories manageable by agents and admins" 
    ON article_categories FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND organization_id = article_categories.organization_id
            AND role IN ('agent', 'admin')
        )
    );

-- Feedback RLS
ALTER TABLE public.article_feedback ENABLE ROW LEVEL SECURITY;

-- Feedback viewable by article owners
CREATE POLICY "Feedback viewable by article owners" 
    ON article_feedback FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM knowledge_articles ka
            JOIN profiles p ON ka.organization_id = p.organization_id
            WHERE ka.id = article_feedback.article_id 
            AND p.id = auth.uid()
            AND p.role IN ('agent', 'admin')
        )
    );

-- Feedback submittable by anyone
CREATE POLICY "Feedback submittable by anyone" 
    ON article_feedback FOR INSERT 
    WITH CHECK (true);

/*
 * Usage Examples
 * =============
 * 
 * 1. Create a new article:
 *    INSERT INTO knowledge_articles (
 *        organization_id, 
 *        title, 
 *        content,
 *        author_id,
 *        tags
 *    ) VALUES (
 *        'org-uuid',
 *        'Getting Started Guide',
 *        'Welcome to our platform...',
 *        'author-uuid',
 *        ARRAY['onboarding', 'tutorial']
 *    );
 * 
 * 2. Create a category hierarchy:
 *    -- Parent category
 *    INSERT INTO article_categories (organization_id, name) 
 *    VALUES ('org-uuid', 'Technical Guides')
 *    RETURNING id;
 *    
 *    -- Child category
 *    INSERT INTO article_categories (
 *        organization_id, 
 *        name, 
 *        parent_id
 *    ) VALUES (
 *        'org-uuid',
 *        'API Documentation',
 *        'parent-category-uuid'
 *    );
 * 
 * 3. Submit article feedback:
 *    INSERT INTO article_feedback (
 *        article_id,
 *        user_id,
 *        rating,
 *        comment
 *    ) VALUES (
 *        'article-uuid',
 *        'user-uuid',
 *        5,
 *        'Very helpful guide!'
 *    );
 * 
 * 4. Query popular articles:
 *    SELECT 
 *        ka.*,
 *        COUNT(av.id) as view_count,
 *        AVG(af.rating) as avg_rating
 *    FROM knowledge_articles ka
 *    LEFT JOIN article_views av ON ka.id = av.article_id
 *    LEFT JOIN article_feedback af ON ka.id = af.article_id
 *    WHERE ka.organization_id = 'org-uuid'
 *    AND ka.status = 'published'
 *    GROUP BY ka.id
 *    ORDER BY view_count DESC;
 */
