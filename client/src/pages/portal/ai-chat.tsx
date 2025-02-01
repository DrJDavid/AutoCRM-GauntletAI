import { AIChat } from '@/components/chat/AIChat';

export default function CustomerAIChat() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Support Assistant</h1>
        <p className="text-muted-foreground">
          Get instant help with your questions
        </p>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm">
        <AIChat />
      </div>
    </div>
  );
} 