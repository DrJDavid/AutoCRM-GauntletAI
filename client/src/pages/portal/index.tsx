import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUserStore } from "@/stores/userStore";
import { Loader2, Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";

export default function CustomerPortal() {
  const { currentUser, isLoading } = useUserStore();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Support Portal</h1>
          <p className="text-gray-500">Welcome back, {currentUser.email}</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Ticket
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Tickets Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Your Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">3</div>
            <p className="text-sm text-gray-500">2 open, 1 resolved</p>
          </CardContent>
        </Card>

        {/* Average Response */}
        <Card>
          <CardHeader>
            <CardTitle>Average Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">2h</div>
            <p className="text-sm text-gray-500">Last 30 days</p>
          </CardContent>
        </Card>

        {/* Knowledge Base */}
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">24</div>
            <p className="text-sm text-gray-500">Help articles available</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tickets */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Recent Tickets</h2>
          <div className="flex gap-4 items-center">
            <Search className="h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search tickets..." 
              className="w-64"
            />
          </div>
        </div>

        <Card>
          <CardContent className="divide-y">
            {[
              { title: "Cannot login to mobile app", status: "Open", priority: "High", updated: "1 hour ago" },
              { title: "Billing question", status: "Open", priority: "Medium", updated: "3 hours ago" },
              { title: "Feature request", status: "Resolved", priority: "Low", updated: "1 day ago" }
            ].map((ticket, i) => (
              <div key={i} className="py-4 first:pt-6 last:pb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="font-medium">{ticket.title}</div>
                    <div className="text-sm text-gray-500">Last updated: {ticket.updated}</div>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-sm ${
                      ticket.status === 'Open' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {ticket.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-sm ${
                      ticket.priority === 'High' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'Medium' ? 'bg-orange-100 text-orange-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {ticket.priority}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Links */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link href="/portal/kb">
            <a className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="font-medium">Knowledge Base</h3>
              <p className="text-sm text-gray-500">Find answers to common questions</p>
            </a>
          </Link>
          <Link href="/portal/support">
            <a className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="font-medium">Contact Support</h3>
              <p className="text-sm text-gray-500">Get help from our team</p>
            </a>
          </Link>
          <Link href="/portal/settings">
            <a className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100">
              <h3 className="font-medium">Account Settings</h3>
              <p className="text-sm text-gray-500">Manage your preferences</p>
            </a>
          </Link>
        </div>
      </div>
    </div>
  );
} 