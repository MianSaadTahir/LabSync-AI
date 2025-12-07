import { MessageList } from "../components/MessageList";
import type { MessageItem } from "@/types/message";

const fetchMessages = async (): Promise<MessageItem[]> => {
  const baseUrl =
    process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

  try {
    const res = await fetch(`${baseUrl}/api/messages`, {
      next: { revalidate: 0 },
    });
    if (!res.ok) {
      console.error("Failed to load messages", await res.text());
      return [];
    }
    const payload = await res.json();
    return payload.data ?? [];
  } catch (error) {
    console.error("Messages fetch error", error);
    return [];
  }
};

export default async function EventsPage() {
  const messages = await fetchMessages();

  return (
    <main className="mx-auto flex min-h-[80vh] w-full max-w-5xl flex-col gap-10 px-4 py-12">
      <header className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-500">
          Inbox
        </p>
        <h1 className="text-3xl font-bold text-slate-900">Telegram Messages</h1>
        <p className="text-slate-500">
          All messages received from Telegram are displayed here in real-time.
        </p>
      </header>
      <MessageList messages={messages} />
    </main>
  );
}
