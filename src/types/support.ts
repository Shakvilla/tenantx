export interface SupportTicket {
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

export interface TicketReply {
  id: string;
  senderType: 'LANDLORD' | 'ADMIN';
  senderName: string;
  message: string;
  createdAt: string;
}

export interface TicketAttachment {
  id: string;
  replyId: string;
  fileUrl: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  createdAt: string;
}

export interface TicketInternalNote {
  id: string;
  ticketId: string;
  adminName: string;
  note: string;
  createdAt: string;
}

export interface TicketPageResponse {
  content: SupportTicket[];
  totalElements: number;
  totalPages: number;
  page: number;
}

// Keep backward-compatible aliases
export type TicketMessage = TicketReply;