// src/types/ticket.ts
import { UserDto } from "@/services/user";
import { EquipeDto } from "@/services/equipe";

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
  user?: UserDto | null; // null se for Log de Sistema
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

// DTO para Estatísticas do Dashboard
export interface DashboardStatsDto {
  totalOpen: number;
  totalClosedToday: number;
  slaCompliancePercentage: number;
  averageRating: number;
  ticketsByStatus: Record<string, number>; // ex: { OPEN: 10, RESOLVED: 5 }
  ticketsByPriority: Record<string, number>;
}
