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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDown } from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const { currentUser } = useUserStore();

  // Redirect logged-in users to their respective dashboards
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
          navigate('/org/new');
      }
    } else {
      navigate('/org/new');
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
              {/* Login Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost">
                    Log in <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/auth/team/login')}>
                    Team & Agent Login
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/auth/customer/login')}>
                    Customer Login
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Register/Join Options */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Get Started <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate('/org/new')}>
                    Create Organization
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/auth/team/create-account')}>
                    Join as Team Member
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/auth/customer/register')}>
                    Register as Customer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
              Create Your Organization
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

          {/* Quick Access Section */}
          <div className="mt-12 border-t pt-8">
            <h2 className="mb-6 text-2xl font-bold">Quick Access</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Have an Invite?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/auth/team/create-account')}
                  >
                    Accept Team/Agent Invite
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/auth/customer/register')}
                  >
                    Accept Customer Invite
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Portal Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/auth/team/login')}
                  >
                    Team & Agent Portal
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => navigate('/auth/customer/login')}
                  >
                    Customer Portal
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}