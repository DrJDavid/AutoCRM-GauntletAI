import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">Welcome to AutoCRM</CardTitle>
          <CardDescription>
            AI-powered customer relationship management
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Management */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Organizations</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => setLocation('/auth/team/register')}
              >
                New Organization
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/auth/team/login')}
              >
                Organization Sign In
              </Button>
            </div>
          </div>

          {/* Team Member */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Team Members</h2>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setLocation('/auth/team/join')}
            >
              New Team Member
            </Button>
          </div>

          {/* Customer Portal */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Customers</h2>
            <Button 
              variant="secondary" 
              className="w-full"
              onClick={() => setLocation('/portal')}
            >
              Customer Portal
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 