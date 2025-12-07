import { MessageCard } from "./MessageCard";
import type { MessageItem } from "@/types/message";

interface MessageListProps {
  messages: MessageItem[];
}

export const MessageList = ({ messages }: MessageListProps) => {
  if (!messages.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        No messages yet. Send something to our Telegram bot to see it here.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {messages.map((message) => (
        <MessageCard key={message._id} message={message} />
      ))}
    </div>
  );
};
