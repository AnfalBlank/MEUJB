export type DocType = "WO" | "SPK";

export type JobStatus = "Done" | "Pending" | "Hold" | "Cancel";

export type SubDivision = 
  | "Fueling System Engineering" 
  | "IT Engineering" 
  | "Electrical Engineering";

export interface Technician {
  id: string;
  name: string;
  role: "Supervisor" | "Teknisi" | "Drafter" | "Manager" | "Marketing";
  phone: string;
  subdiv: string;
}

export interface AssignedTech {
  technicianId?: string;
  name: string;
  subdiv: string;
  kasbon: number;
}

export interface SpdExpense {
  category: "SPD" | "Proyek";
  days: number;
  dailyRate: number;
  nights: number;
  hotelRate: number;
  totalSpd: number;
}

export interface WorkOrderPhoto {
  id: string;
  fileName: string;
  driveUrl: string;
  caption?: string;
  uploadedAt: string;
}

export interface WorkOrderJob {
  id: string;
  docType: DocType;
  docNumber: string;
  marketing: string;
  subdiv: SubDivision;
  customer: string;
  desc: string;
  target: string; // Durasi e.g. "3 Hari"
  date: string; // YYYY-MM-DD (Tanggal Mulai/Referensi)
  startDate?: string; // YYYY-MM-DD (Tanggal Mulai Pelaksanaan)
  targetDate?: string; // YYYY-MM-DD (Target Tanggal Selesai)
  techs: AssignedTech[];
  spdType: "SPD" | "Proyek";
  spdDays: number;
  spdDaily: number;
  spdNights: number;
  spdHotel: number;
  baLink: string;
  baFileName?: string;
  photos: WorkOrderPhoto[];
  kasbonUsed: number; // Realisasi actual expense
  status: JobStatus;
  statusNote: string;
  gdriveFolderId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DivisionMeta {
  name: SubDivision;
  shortName: string;
  iconName: "Fuel" | "Network" | "Zap";
  accentColor: string;
  bgSoft: string;
  borderSoft: string;
  textColor: string;
  badgeBg: string;
}

export type UserRole = "superadmin" | "admin" | "manager";

export interface SystemUser {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  isRoot?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthUser {
  id?: string;
  username: string;
  name: string;
  role: UserRole | string;
  isRoot?: boolean;
  loggedInAt?: string;
}

export type AuditCategory = "AUTH" | "WORK_ORDER" | "TEAM" | "USER_MANAGEMENT" | "SYSTEM";

export type AuditAction = 
  | "LOGIN"
  | "LOGOUT"
  | "LOGIN_FAILED"
  | "CREATE_JOB"
  | "UPDATE_JOB"
  | "DELETE_JOB"
  | "UPDATE_STATUS"
  | "CREATE_MEMBER"
  | "UPDATE_MEMBER"
  | "DELETE_MEMBER"
  | "CREATE_USER"
  | "UPDATE_USER"
  | "DELETE_USER"
  | "UPDATE_PROFILE"
  | "INIT_SYSTEM";

export interface AuditLogItem {
  id: string;
  userId?: string;
  username: string;
  userName: string;
  userRole: string;
  action: AuditAction | string;
  category: AuditCategory | string;
  details: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}


