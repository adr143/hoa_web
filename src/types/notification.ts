export type NotificationType =
  | 'new_application'
  | 'proposal_update'
  | 'job_posted'
  | 'message'
  | 'system'
  | 'verification'
  | 'custom';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  date: string;
  link?: string;
  related_id?: string;
  sender_id?: string;
  recipient_id?: string;
  additional_content?: string;
}