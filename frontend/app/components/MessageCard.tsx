import type { MessageItem } from "@/types/message";
import { StatusIndicator } from "./StatusIndicator";

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
  const hasMeetingDetails = message.meeting_details && message.meeting_details.project_name;
  const hasExtracted = message.extracted && (
    message.extracted.domain || 
    message.extracted.budget || 
    message.extracted.timeline
  );

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-lg font-semibold text-slate-900 flex-1">
          {hasMeetingDetails ? message.meeting_details?.project_name : (message.text?.substring(0, 100) || "No text provided")}
        </h3>
        <StatusIndicator 
          module1={message.module1_status}
          module2={message.module2_status}
          module3={message.module3_status}
        />
      </div>

      {hasMeetingDetails && (
        <div className="mt-4 rounded-lg bg-green-50 border border-green-200 p-4 space-y-2">
          <p className="text-sm font-semibold text-green-900 mb-3">Meeting Details (Module 1):</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-semibold text-slate-700">Client:</span>
              <span className="ml-2 text-slate-600">{message.meeting_details?.client_details?.name}</span>
            </div>
            {message.meeting_details?.client_details?.company && (
              <div>
                <span className="font-semibold text-slate-700">Company:</span>
                <span className="ml-2 text-slate-600">{message.meeting_details.client_details.company}</span>
              </div>
            )}
            <div>
              <span className="font-semibold text-slate-700">Budget:</span>
              <span className="ml-2 text-slate-600">${message.meeting_details?.estimated_budget?.toLocaleString() || 0}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-700">Timeline:</span>
              <span className="ml-2 text-slate-600">{message.meeting_details?.timeline || 'N/A'}</span>
            </div>
          </div>
          {message.meeting_details?.requirements && (
            <div className="mt-2 pt-2 border-t border-green-200">
              <span className="font-semibold text-slate-700 text-sm">Requirements:</span>
              <p className="text-sm text-slate-600 mt-1">{message.meeting_details.requirements.substring(0, 200)}...</p>
            </div>
          )}
        </div>
      )}
      
      {hasExtracted && !hasMeetingDetails && (
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

      {!hasMeetingDetails && (
        <p className="mt-3 text-sm text-slate-600 line-clamp-3">
          {message.text || "No text provided"}
        </p>
      )}
      
      <div className="mt-4 pt-3 border-t border-slate-200">
        <p className="text-xs text-slate-500">
          Sender: <span className="font-mono">{message.sender_id}</span>
        </p>
        <p className="mt-1 text-xs text-slate-500">
          Received: {formatTimestamp(message.date_received || message.createdAt)}
        </p>
      </div>
    </article>
  );
};
