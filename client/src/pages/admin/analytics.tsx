import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Analytics() {
  const metrics = [
    {
      title: "Response Time",
      data: [
        { label: "< 1 hour", value: "45%" },
        { label: "1-4 hours", value: "30%" },
        { label: "4-24 hours", value: "20%" },
        { label: "> 24 hours", value: "5%" },
      ]
    },
    {
      title: "Ticket Categories",
      data: [
        { label: "Technical", value: "40%" },
        { label: "Billing", value: "25%" },
        { label: "Account", value: "20%" },
        { label: "Other", value: "15%" },
      ]
    },
    {
      title: "Customer Satisfaction",
      data: [
        { label: "Very Satisfied", value: "60%" },
        { label: "Satisfied", value: "25%" },
        { label: "Neutral", value: "10%" },
        { label: "Unsatisfied", value: "5%" },
      ]
    }
  ];

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Analytics</h1>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader>
              <CardTitle>{metric.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metric.data.map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-gray-600">{item.label}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: item.value }}
                        />
                      </div>
                      <span className="text-sm font-medium">{item.value}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}

        <Card>
          <CardHeader>
            <CardTitle>Ticket Volume Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>This Week</span>
                <span className="font-bold">156 tickets</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Last Week</span>
                <span className="font-bold">142 tickets</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Growth</span>
                <span className="text-green-600 font-bold">+9.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Agent Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Avg. Resolution Time</span>
                <span className="font-bold">2.5 hours</span>
              </div>
              <div className="flex justify-between items-center">
                <span>First Response Time</span>
                <span className="font-bold">15 minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Customer Satisfaction</span>
                <span className="text-green-600 font-bold">94%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 