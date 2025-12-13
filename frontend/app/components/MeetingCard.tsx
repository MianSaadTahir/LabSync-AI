import type { MeetingItem } from "@/types/meeting";

const formatDate = (dateString?: string) => {
  if (!dateString) return "Unknown date";
  return new Date(dateString).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

interface MeetingCardProps {
  meeting: MeetingItem;
}

export const MeetingCard = ({ meeting }: MeetingCardProps) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="text-lg font-semibold text-slate-900">
          {meeting.project_name}
        </h3>
      </div>

      <div className="space-y-3">
        <div>
          <p className="text-sm font-semibold text-slate-700">Client</p>
          <p className="text-sm text-slate-600">
            {meeting.client_details.name}
            {meeting.client_details.company && ` - ${meeting.client_details.company}`}
          </p>
          {meeting.client_details.email && (
            <p className="text-xs text-slate-500">{meeting.client_details.email}</p>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">Estimated Budget</p>
          <p className="text-lg font-bold text-blue-600">
            {formatCurrency(meeting.estimated_budget)}
          </p>
        </div>

        <div>
          <p className="text-sm font-semibold text-slate-700">Timeline</p>
          <p className="text-sm text-slate-600">{meeting.timeline}</p>
        </div>

        {meeting.participants.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700">Participants</p>
            <p className="text-sm text-slate-600">{meeting.participants.join(", ")}</p>
          </div>
        )}

        <div>
          <p className="text-sm font-semibold text-slate-700">Meeting Date</p>
          <p className="text-sm text-slate-600">{formatDate(meeting.meeting_date)}</p>
        </div>

        {meeting.requirements && (
          <div>
            <p className="text-sm font-semibold text-slate-700">Requirements</p>
            <p className="text-sm text-slate-600 line-clamp-3">{meeting.requirements}</p>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Extracted: {formatDate(meeting.extracted_at)}
      </p>
    </article>
  );
};





