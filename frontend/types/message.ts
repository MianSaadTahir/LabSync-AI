export type MessageTag = "meeting" | "reminder" | "task" | "none";

export interface ExtractedData {
  domain?: string;
  budget?: string;
  timeline?: string;
}

export interface MessageItem {
  _id: string;
  message_id: string;
  sender_id: string;
  text: string;
  tag?: MessageTag;
  date_received?: string;
  createdAt?: string;
  updatedAt?: string;
  raw_payload?: unknown;
  extracted?: ExtractedData;
}

