import { FC } from 'react';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  MessageSquare,
  Mail,
  PhoneCall,
  BookOpen,
  Clock,
  ArrowRight,
} from 'lucide-react';

const SupportPage: FC = () => {
  const [, setLocation] = useLocation();

  const supportOptions = [
    {
      title: 'Create a Support Ticket',
      description: 'Submit a new support request and get help from our team.',
      icon: MessageSquare,
      action: () => setLocation('/portal/tickets/new'),
      primary: true,
    },
    {
      title: 'Knowledge Base',
      description: 'Find answers to common questions in our documentation.',
      icon: BookOpen,
      action: () => setLocation('/portal/kb'),
    },
    {
      title: 'Email Support',
      description: 'Send us an email and we\'ll get back to you within 24 hours.',
      icon: Mail,
      action: () => window.location.href = 'mailto:support@example.com',
    },
    {
      title: 'Phone Support',
      description: 'Available Monday to Friday, 9 AM to 5 PM EST.',
      icon: PhoneCall,
      action: () => window.location.href = 'tel:+1234567890',
    },
  ];

  const businessHours = [
    { day: 'Monday - Friday', hours: '9:00 AM - 5:00 PM EST' },
    { day: 'Saturday', hours: '10:00 AM - 2:00 PM EST' },
    { day: 'Sunday', hours: 'Closed' },
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Support Center</h1>
      </div>

      {/* Support Options */}
      <div className="grid gap-4 md:grid-cols-2">
        {supportOptions.map((option) => {
          const Icon = option.icon;
          return (
            <Card
              key={option.title}
              className={`cursor-pointer hover:bg-accent/5 transition-colors ${
                option.primary ? 'border-primary' : ''
              }`}
              onClick={option.action}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{option.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {option.description}
                </p>
                <ArrowRight className="h-5 w-5 text-muted-foreground" />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Business Hours */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <CardTitle>Business Hours</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {businessHours.map(({ day, hours }) => (
              <div
                key={day}
                className="flex justify-between items-center text-sm"
              >
                <span className="font-medium">{day}</span>
                <span className="text-muted-foreground">{hours}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Emergency Support */}
      <Card>
        <CardHeader>
          <CardTitle>Emergency Support</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            For urgent issues outside business hours, please call our emergency support line.
          </p>
          <Button
            variant="outline"
            onClick={() => window.location.href = 'tel:+1234567890'}
          >
            Call Emergency Support
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupportPage;