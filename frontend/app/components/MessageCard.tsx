import type { MessageItem } from "@/types/message";

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return "Unknown time";
  return new Date(timestamp).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
};

interface MessageCardProps {
  message: MessageItem;
}

export const MessageCard = ({ message }: MessageCardProps) => {
  const hasExtracted = message.extracted && (
    message.extracted.domain || 
    message.extracted.budget || 
    message.extracted.timeline
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">
          {message.text || "No text provided"}
        </h3>
      </div>
      
      {hasExtracted && (
        <div className="mt-4 rounded-lg bg-blue-50 p-4 space-y-2">
          <p className="text-sm font-semibold text-blue-900 mb-3">Extracted Information:</p>
          {message.extracted?.domain && (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Domain:</span> {message.extracted.domain}
            </p>
          )}
          {message.extracted?.budget && (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Budget:</span> {message.extracted.budget}
            </p>
          )}
          {message.extracted?.timeline && (
            <p className="text-sm text-slate-700">
              <span className="font-semibold">Timeline:</span> {message.extracted.timeline}
            </p>
          )}
        </div>
      )}
      
      <p className="mt-4 text-sm text-slate-500">
        Sender: <span className="font-mono">{message.sender_id}</span>
      </p>
      <p className="mt-2 text-sm font-medium text-slate-700">
        Received: {formatTimestamp(message.date_received || message.createdAt)}
      </p>
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
        Message ID: {message.message_id}
      </p>
    </article>
  );
};
