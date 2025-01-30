import { FC, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search } from 'lucide-react';

// This is a placeholder until we implement the actual knowledge base
const SAMPLE_ARTICLES = [
  {
    id: 1,
    title: 'Getting Started Guide',
    category: 'General',
    description: 'Learn the basics of using our platform and its features.',
  },
  {
    id: 2,
    title: 'Account Management',
    category: 'Account',
    description: 'How to manage your account settings and preferences.',
  },
  {
    id: 3,
    title: 'Billing and Subscriptions',
    category: 'Billing',
    description: 'Understanding your billing cycle and subscription options.',
  },
  {
    id: 4,
    title: 'Common Issues and Solutions',
    category: 'Troubleshooting',
    description: 'Solutions to frequently encountered problems.',
  },
  {
    id: 5,
    title: 'Security Best Practices',
    category: 'Security',
    description: 'Keep your account and data secure with these guidelines.',
  },
];

const CATEGORIES = [
  'All',
  'General',
  'Account',
  'Billing',
  'Troubleshooting',
  'Security',
];

const KnowledgeBasePage: FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredArticles = SAMPLE_ARTICLES.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || article.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Knowledge Base</h1>
      </div>

      {/* Search and Filter */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category)}
              className="whitespace-nowrap"
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredArticles.map((article) => (
          <Card
            key={article.id}
            className="cursor-pointer hover:bg-accent/5 transition-colors"
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-lg">{article.title}</CardTitle>
                <span className="text-sm text-muted-foreground">
                  {article.category}
                </span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {article.description}
              </p>
            </CardContent>
          </Card>
        ))}

        {filteredArticles.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No articles found matching your search criteria
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Help Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Can't find what you're looking for?</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <p className="text-muted-foreground">
            Our support team is here to help you with any questions you may have.
          </p>
          <Button onClick={() => window.location.href = '/portal/support'}>
            Contact Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default KnowledgeBasePage;