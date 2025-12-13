export interface ClientDetails {
  name: string;
  email?: string;
  company?: string;
}

export interface MeetingItem {
  _id: string;
  messageId: string;
  project_name: string;
  client_details: ClientDetails;
  meeting_date: string;
  participants: string[];
  estimated_budget: number;
  timeline: string;
  requirements: string;
  extracted_at: string;
  createdAt?: string;
  updatedAt?: string;
}





