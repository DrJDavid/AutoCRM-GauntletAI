import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { PortalLayout } from '@/components/layout/PortalLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function CustomerPortal() {
  const [, setLocation] = useLocation();

  return (
    <PortalLayout>
      <div className="max-w-4xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold">Customer Portal</CardTitle>
            <CardDescription>
              Access support, knowledge base, and manage your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Account Access */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Account Access</h2>
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="default" 
                  className="w-full"
                  onClick={() => setLocation('/auth/customer/login')}
                >
                  Sign In
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => setLocation('/auth/customer/register')}
                >
                  Create Account
                </Button>
              </div>
            </div>

            {/* Knowledge Base */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Resources</h2>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => setLocation('/portal/kb')}
                >
                  Browse Knowledge Base
                </Button>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold">Need Help?</h2>
              <div className="grid grid-cols-1 gap-3">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => setLocation('/portal/support')}
                >
                  Contact Support
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PortalLayout>
  );
} 