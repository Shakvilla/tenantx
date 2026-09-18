export interface AdminSupportTicket {
  id: string;
  tenantId: string;
  submitterEmail: string;
  subject: string;
  body: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'WAITING_TENANT' | 'WAITING_LANDLORD' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  category: 'GENERAL' | 'MAINTENANCE' | 'RENT' | 'LEASE' | 'ACCESS' | 'SAFETY' | 'OTHER';
  assignedTo: string | null;
  replyCount: number;
  lastReplyAt: string | null;
  createdAt: string;
  updatedAt: string;
}