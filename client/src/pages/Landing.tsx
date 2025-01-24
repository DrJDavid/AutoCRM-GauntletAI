import { useLocation } from 'wouter';
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
  const [, setLocation] = useLocation();
  const { currentUser } = useUserStore();

  const handleCustomerPortalAccess = () => {
    if (currentUser) {
      setLocation('/portal');
    } else {
      setLocation('/auth/customer/login');
    }
  };

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
          {/* Organization Creation & Access */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Organizations</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="default" 
                className="w-full"
                onClick={() => setLocation('/org/new')}
              >
                Create Organization
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setLocation('/org/login')}
              >
                Sign In to Organization
              </Button>
            </div>
          </div>

          {/* Team Member & Customer Access */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Have an Invite?</h2>
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setLocation('/auth/team/accept-invite')}
              >
                Accept Team Invite
              </Button>
              <Button 
                variant="secondary" 
                className="w-full"
                onClick={() => setLocation('/auth/customer/accept-invite')}
              >
                Accept Customer Invite
              </Button>
            </div>
          </div>

          {/* Customer Portal */}
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Existing Customer?</h2>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={handleCustomerPortalAccess}
            >
              {currentUser ? 'Go to Customer Portal' : 'Sign In to Customer Portal'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}