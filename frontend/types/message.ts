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
  meeting_details?: {
    project_name?: string;
    client_details?: {
      name?: string;
      email?: string;
      company?: string;
    };
    meeting_date?: string;
    participants?: string[];
    estimated_budget?: number;
    timeline?: string;
    requirements?: string;
  };
  module1_status?: 'pending' | 'extracted' | 'failed';
  module2_status?: 'pending' | 'designed' | 'failed';
  module3_status?: 'pending' | 'allocated' | 'failed';
}

