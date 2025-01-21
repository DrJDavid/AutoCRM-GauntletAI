import { useState } from 'react';
import { useUserStore } from '@/stores/userStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { RichTextEditor } from '@/components/shared/RichTextEditor';
import { FileUpload } from '@/components/shared/FileUpload';
import type { TicketDetailProps, TicketMessage } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export function TicketDetail({ ticket, messages }: TicketDetailProps) {
  const [newMessage, setNewMessage] = useState('');
  const [attachments, setAttachments] = useState<string[]>([]);
  const { currentUser } = useUserStore();
  const isAgent = currentUser?.role === 'agent';

  const handleSubmitMessage = () => {
    // Handle message submission through Supabase
    console.log('Submit message:', { newMessage, attachments });
    setNewMessage('');
    setAttachments([]);
  };

  const renderMessage = (message: TicketMessage) => (
    <div
      key={message.id}
      className={`flex flex-col gap-2 p-4 rounded-lg mb-4 ${
        message.isInternal ? 'bg-yellow-50' : 'bg-gray-50'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <span className="font-medium">{message.userId}</span>
          {message.isInternal && (
            <span className="ml-2 text-xs bg-yellow-200 text-yellow-800 px-2 py-0.5 rounded">
              Internal Note
            </span>
          )}
        </div>
        <span className="text-sm text-gray-500">
          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
        </span>
      </div>
      <div className="prose prose-sm max-w-none">
        {message.content}
      </div>
      {message.attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {message.attachments.map((url) => (
            <a
              key={url}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              Attachment
            </a>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">{ticket.title}</CardTitle>
          <StatusBadge status={ticket.status} />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <div>
                <span className="text-gray-500">Priority:</span>{' '}
                <span className="font-medium">{ticket.priority}</span>
              </div>
              <div>
                <span className="text-gray-500">Created:</span>{' '}
                <span className="font-medium">
                  {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Customer:</span>{' '}
                <span className="font-medium">{ticket.customerId}</span>
              </div>
              {ticket.assignedAgentId && (
                <div>
                  <span className="text-gray-500">Assigned to:</span>{' '}
                  <span className="font-medium">{ticket.assignedAgentId}</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {ticket.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-sm"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {messages.map(renderMessage)}
      </div>

      <Card>
        <CardContent className="space-y-4 pt-4">
          <RichTextEditor
            value={newMessage}
            onChange={setNewMessage}
            placeholder="Type your message..."
          />
          <FileUpload
            onUploadComplete={(urls) => setAttachments(urls)}
            maxFiles={5}
          />
          <div className="flex justify-end gap-2">
            {isAgent && (
              <Button
                variant="outline"
                onClick={() => console.log('Save as internal note')}
              >
                Save as Internal Note
              </Button>
            )}
            <Button onClick={handleSubmitMessage}>
              Send Message
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
