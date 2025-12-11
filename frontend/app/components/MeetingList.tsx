import { MeetingCard } from "./MeetingCard";
import type { MeetingItem } from "@/types/meeting";

interface MeetingListProps {
  meetings: MeetingItem[];
}

export const MeetingList = ({ meetings }: MeetingListProps) => {
  if (!meetings.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-slate-500">
        No meetings extracted yet. Send a message to the Telegram bot to see extracted meetings here.
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {meetings.map((meeting) => (
        <MeetingCard key={meeting._id} meeting={meeting} />
      ))}
    </div>
  );
};





