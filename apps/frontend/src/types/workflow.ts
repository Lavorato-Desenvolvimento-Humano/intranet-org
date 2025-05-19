// src/types/workflow.ts
export interface WorkflowTemplateDto {
  id: string;
  name: string;
  description: string;
  visibility: "public" | "restricted" | "team";
  createdById: string;
  createdByName: string;
  steps: WorkflowTemplateStepDto[];
  workflowCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTemplateStepDto {
  id: string;
  templateId: string;
  name: string;
  description: string;
  stepOrder: number;
}

export interface WorkflowTemplateCreateDto {
  name: string;
  description: string;
  visibility: "public" | "restricted" | "team";
  steps: WorkflowTemplateStepCreateDto[];
}

export interface WorkflowTemplateStepCreateDto {
  name: string;
  description: string;
  stepOrder: number;
}

export interface WorkflowSummaryDto {
  id: string;
  title: string;
  templateName: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "in_progress" | "paused" | "completed" | "canceled" | "archived";
  deadline: string | null;
  teamName: string | null;
  createdByName: string;
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
  currentAssigneeId: string | null;
  currentAssigneeName: string | null;
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  isNearDeadline: boolean;
  daysRemaining: number;
  statusTemplateId?: string | null;
  customStatusId?: string | null;
  customStatusName?: string | null;
  customStatusColor?: string | null;
}

export interface WorkflowDto {
  id: string;
  templateId: string;
  templateName: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "in_progress" | "paused" | "completed" | "canceled" | "archived";
  visibility: "public" | "restricted" | "team";
  deadline: string | null;
  teamId: string | null;
  teamName: string | null;
  createdById: string;
  createdByName: string;
  currentStep: number;
  totalSteps: number;
  progressPercentage: number;
  assignments: WorkflowAssignmentDto[];
  transitions: WorkflowTransitionDto[];
  createdAt: string;
  updatedAt: string;
  isOverdue: boolean;
  isNearDeadline: boolean;
  daysRemaining: number;
  statusTemplateId?: string | null;
  statusTemplateName?: string | null;
  customStatusId?: string | null;
  customStatusName?: string | null;
  customStatusColor?: string | null;
}

export interface WorkflowCreateDto {
  templateId: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  visibility: "public" | "restricted" | "team";
  deadline: string | null;
  teamId: string | null;
  assignToId: string | null;
  statusTemplateId?: string | null; // Campo novo
}

export interface WorkflowAssignmentDto {
  id: string;
  workflowId: string;
  workflowTitle: string;
  stepNumber: number;
  stepName: string;
  stepDescription?: string;
  assignedToId: string;
  assignedToName: string;
  status: "pending" | "in_progress" | "completed";
  startDate: string | null;
  completionDate: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowTransitionDto {
  id: string;
  workflowId: string;
  fromStep: number | null;
  fromStepName: string | null;
  toStep: number | null;
  toStepName: string | null;
  fromStatus: string | null;
  toStatus: string | null;
  fromUserId: string | null;
  fromUserName: string | null;
  toUserId: string | null;
  toUserName: string | null;
  comments: string | null;
  transitionType: "creation" | "assignment" | "status_change" | "step_change";
  createdById: string;
  createdByName: string;
  createdAt: string;
}

export interface WorkflowStatsDto {
  totalWorkflows: number;
  inProgressCount: number;
  pausedCount: number;
  completedCount: number;
  canceledCount: number;
  archivedCount: number;
  lowPriorityCount: number;
  mediumPriorityCount: number;
  highPriorityCount: number;
  urgentPriorityCount: number;
  publicCount: number;
  restrictedCount: number;
  teamCount: number;
  overdueCount: number;
  nearDeadlineCount: number;
  onTrackCount: number;
  totalStepsCount: number;
  completedStepsCount: number;
  averageWorkflowDurationDays: number;
  workflowsByTeam: Record<string, number>;
  workflowsByTemplate: Record<string, number>;
  completionRate: number;
  onTimeCompletionRate: number;
  averageTimePerStep: number;
}

export interface UserWorkloadDto {
  userId: string;
  userName: string;
  userEmail: string;
  profileImage: string | null;
  activeAssignmentsCount: number;
  pendingAssignmentsCount: number;
  totalAssignmentsCount: number;
  overdueAssignmentsCount: number;
  workloadPercentage: number;
  isOverloaded: boolean;
  activeAssignments: WorkflowAssignmentDto[];
}

export interface WorkflowNotificationDto {
  id: string;
  workflowId: string;
  workflowTitle: string;
  userId: string;
  title: string;
  message: string;
  type: "assignment" | "deadline" | "status_change";
  read: boolean;
  createdAt: string;
}

export interface WorkflowStatusItemDto {
  id: string;
  templateId: string;
  name: string;
  description: string;
  color: string;
  orderIndex: number;
  isInitial: boolean;
  isFinal: boolean;
}

export interface WorkflowStatusTemplateDto {
  id: string;
  name: string;
  description: string;
  createdById: string;
  createdByName: string;
  statusItems: WorkflowStatusItemDto[];
  workflowCount: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStatusItemCreateDto {
  name: string;
  description: string;
  color: string;
  orderIndex: number;
  isInitial: boolean;
  isFinal: boolean;
}

export interface WorkflowStatusTemplateCreateDto {
  name: string;
  description: string;
  statusItems: WorkflowStatusItemCreateDto[];
  isDefault: boolean;
}
