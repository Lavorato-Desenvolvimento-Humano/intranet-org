import { UserDto } from "@/services/user";

export interface userDto {
  id: string;
  username: string;
  email: string;
  fullName: string;
  profileImage?: string;
  roles: string[];
  teams?: string[];
  isActive: boolean;
  emailVerified: boolean;
  adminApproved: boolean;
}

export interface JwtTokenInfo {
  sub: string;
  roles: string[];
  iat: number;
  exp: number;
}

export interface AuthContextType {
  user: userDto | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  checkPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  validateToken: () => Promise<boolean>;
}

export interface DriveAuthResponse {
  valid: boolean;
  user?: userDto;
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface JwtResponse {
  token: string;
  id: string;
  fullName: string;
  email: string;
  profileImage?: string;
  roles: string[];
  emailVerified: boolean;
  adminApproved: boolean;
}

export const USER_ROLES = {
  ADMIN: "ADMIN",
  USER: "USER",
  SUPERVISOR: "SUPERVISOR",
  GERENTE: "GERENTE",
  ROLE_ADMIN: "ROLE_ADMIN",
  ROLE_USER: "ROLE_USER",
  ROLE_SUPERVISOR: "ROLE_SUPERVISOR",
  ROLE_GERENTE: "ROLE_GERENTE",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export enum DrivePermission {
  READ = "drive:read",
  WRITE = "drive:write",
  DELETE = "drive:delete",
  SHARE = "drive:share",
  ADMIN = "drive:admin",
  UPLOAD = "drive:upload",
  DOWNLOAD = "drive:download",
  CREATE_FOLDER = "drive:create_folder",
  MANAGE_PERMISSIONS = "drive:manage_permissions",
  VIEW_AUDIT = "drive:view_audit",
}
