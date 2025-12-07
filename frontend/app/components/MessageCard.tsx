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
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-slate-900">
          {message.text || "No text provided"}
        </h3>
        {/* <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600">
          {message.tag ?? "none"}
        </span> */}
      </div>
      <p className="mt-2 text-sm text-slate-500">
        Sender: <span className="font-mono">{message.sender_id}</span>
      </p>
      <p className="mt-4 text-sm font-medium text-slate-700">
        Received: {formatTimestamp(message.date_received || message.createdAt)}
      </p>
      <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
        Message ID: {message.message_id}
      </p>
    </article>
  );
};
