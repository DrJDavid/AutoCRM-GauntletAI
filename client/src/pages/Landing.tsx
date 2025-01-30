import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUserStore } from '@/stores/userStore';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();

  const handleGetStarted = () => {
    if (currentUser) {
      switch (currentUser.role) {
        case 'admin':
        case 'head_admin':
          navigate('/admin');
          break;
        case 'agent':
          navigate('/agent');
          break;
        case 'customer':
          navigate('/portal');
          break;
        default:
          navigate('/login');
      }
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-16 items-center border-b px-4">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-semibold">AutoCRM</h1>
        </div>
        <div className="ml-auto flex items-center gap-4">
          {!currentUser && (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button onClick={() => navigate('/register')}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">
        <section className="container mx-auto grid items-center gap-6 pb-8 pt-6 md:py-10">
          <div className="flex max-w-[980px] flex-col items-start gap-2">
            <h1 className="text-3xl font-extrabold leading-tight tracking-tighter md:text-4xl">
              Streamline Your Customer Support <br className="hidden sm:inline" />
              with AI-Powered Automation
            </h1>
            <p className="max-w-[700px] text-lg text-muted-foreground">
              Empower your support team with intelligent ticket routing, automated responses,
              and data-driven insights to deliver exceptional customer service.
            </p>
          </div>
          <div className="flex gap-4">
            <Button size="lg" onClick={handleGetStarted}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/kb')}>
              Learn More
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Smart Ticket Routing</CardTitle>
                <CardDescription>
                  Automatically assign tickets to the right agents based on expertise and workload.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Our AI analyzes ticket content and agent skills to ensure optimal ticket distribution
                  and faster resolution times.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Responses</CardTitle>
                <CardDescription>
                  Generate intelligent responses to common customer inquiries.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Leverage machine learning to provide accurate and helpful responses while maintaining
                  a personal touch.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analytics Dashboard</CardTitle>
                <CardDescription>
                  Make data-driven decisions with comprehensive insights.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Track key metrics, identify trends, and optimize your support operations with
                  real-time analytics.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </div>
  );
}