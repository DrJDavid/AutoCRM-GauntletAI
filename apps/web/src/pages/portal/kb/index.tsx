import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Search } from 'lucide-react';

// Temporary mock data
const categories = [
  { id: 1, name: 'Getting Started', articleCount: 5 },
  { id: 2, name: 'Account Management', articleCount: 3 },
  { id: 3, name: 'Billing & Subscriptions', articleCount: 4 },
  { id: 4, name: 'Troubleshooting', articleCount: 6 },
];

const popularArticles = [
  { id: 1, title: 'How to create your first ticket', category: 'Getting Started' },
  { id: 2, title: 'Managing your account settings', category: 'Account Management' },
  { id: 3, title: 'Understanding billing cycles', category: 'Billing & Subscriptions' },
  { id: 4, title: 'Common login issues', category: 'Troubleshooting' },
];

export default function KnowledgeBase() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <PortalLayout>
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Hero Section with Search */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900">Knowledge Base</h1>
          <p className="mt-4 text-lg text-gray-600">
            Find answers to common questions and learn how to make the most of our platform
          </p>
          <div className="mt-8 max-w-3xl mx-auto">
            <div className="flex gap-2">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search articles..."
                  className="w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl">{category.name}</CardTitle>
                  <CardDescription>{category.articleCount} articles</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setLocation(`/portal/kb/categories/${category.id}`)}
                  >
                    Browse Articles
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Popular Articles */}
        <div>
          <h2 className="text-2xl font-bold mb-6">Popular Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {popularArticles.map((article) => (
              <Card key={article.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                  <CardDescription>{article.category}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => setLocation(`/portal/kb/articles/${article.id}`)}
                  >
                    Read More
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}