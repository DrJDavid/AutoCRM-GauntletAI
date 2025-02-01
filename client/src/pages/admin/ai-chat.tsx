import { AIChat } from '@/components/chat/AIChat';

export default function AdminAIChat() {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">AI Assistant</h1>
      </div>
      
      <div className="bg-card rounded-lg border shadow-sm">
        <AIChat />
      </div>
    </div>
  );
} 