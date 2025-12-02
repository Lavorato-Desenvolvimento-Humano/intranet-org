// src/types/ticket.ts
export enum TicketPriority {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export enum TicketStatus {
  OPEN = "OPEN",
  IN_PROGRESS = "IN_PROGRESS",
  WAITING = "WAITING",
  RESOLVED = "RESOLVED",
  CLOSED = "CLOSED",
}

export enum InteractionType {
  COMMENT = "COMMENT",
  SYSTEM_LOG = "SYSTEM_LOG",
  ATTACHMENT = "ATTACHMENT",
}

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;

  createdAt: string;
  dueDate?: string;
  closedAt?: string;

  // Campos "achatados" (Flattened)
  requesterId: string;
  requesterName: string;
  requesterEmail: string;

  assigneeId?: string | null;
  assigneeName?: string | null;

  targetTeamId?: string | null;
  targetTeamNome?: string | null; // Agora o TS vai reconhecer este campo

  // CSAT
  rating?: number;
  ratingComment?: string;
}

export interface TicketInteraction {
  id: number;
  ticketId: number;

  userId?: string | null;
  userName?: string | null;
  userEmail?: string | null;
  userProfileImage?: string | null;

  type: InteractionType;
  content: string;
  attachmentUrl?: string;
  createdAt: string;
}

// DTO para Criação (Frontend -> Backend)
export interface TicketCreateData {
  title: string;
  description: string;
  priority: TicketPriority;
  targetTeamId: string;
  file?: File | null; // Arquivo opcional
}

export interface DashboardStatsDto {
  totalOpen: number;
  totalClosedToday: number;
  slaCompliancePercentage: number;
  averageRating: number;
  ticketsByStatus: Record<string, number>;
  ticketsByPriority: Record<string, number>;

  ticketsAtRisk: TicketDto[];
  lowRatedTickets: TicketDto[];
  recentActivity: TicketDto[];
  recentlyClosed: TicketDto[];
}

export interface TicketDto {
  id: number;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  dueDate?: string;
  closedAt?: string;
  updatedAt?: string;
  rating?: number;
  ratingComment?: string;

  requesterId: string;
  requesterName: string;
  requesterEmail: string;

  assigneeId?: string | null;
  assigneeName?: string | null;

  targetTeamId?: string | null;
  targetTeamNome?: string | null;
}
