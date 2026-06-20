/**
 * TypeScript type definitions for Gurukool backend.
 * These define the "shape" of data throughout the app.
 */

// ============================================================
// User Types
// ============================================================

export type AuthProvider = 'google' | 'phone' | 'linkedin' | 'github';
export type UserRole = 'student' | 'admin' | 'moderator';
export type TestType = 'topic' | 'subject' | 'full_length';
export type AttemptStatus = 'in_progress' | 'submitted';
export type ExamCode = 'GATE' | 'PSU' | 'ESE';

export interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  avatar: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspaceSettings {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'saffron';
  sidebar_collapsed: boolean;
  notifications_enabled: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AppUser {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  auth_provider: AuthProvider;
  google_id: string | null;
  github_id: string | null;
  linkedin_id: string | null;
  profile_completed: boolean;
  is_verified: boolean;
  is_active: boolean;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
  profile?: UserProfile;
  workspaceSettings?: WorkspaceSettings;
}

export type User = AppUser;

export interface CreateUserDTO {
  email?: string;
  phone?: string;
  fullName: string;
  avatarUrl?: string | null;
  googleId?: string;
  githubId?: string;
  linkedinId?: string;
  authProvider: AuthProvider;
  isVerified?: boolean;
}

// ============================================================
// Session Types
// ============================================================

export interface DeviceInfo {
  os: string;
  browser: string;
  ip: string;
  userAgent: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  session_identifier: string;
  token_hash: string;
  refresh_token_hash: string | null;
  device_info: DeviceInfo;
  is_active: boolean;
  created_at: Date;
  expires_at: Date;
  last_active_at: Date;
}

// ============================================================
// Auth Types
// ============================================================

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string | null;
  role: UserRole;
  sessionId: string;
  type: 'access' | 'refresh';
}

export interface OTPRecord {
  id: string;
  phone: string;
  otp_hash: string;
  attempts: number;
  max_attempts: number;
  is_used: boolean;
  created_at: Date;
  expires_at: Date;
}

// ============================================================
// Test Engine Types
// ============================================================

export interface QuestionOption {
  id: string;
  text: string;
}

export interface TestCatalogItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  testType: TestType;
  durationMinutes: number;
  totalMarks: number;
  totalQuestions: number;
  subjectCode: string | null;
  subjectName: string | null;
  topicSlug: string | null;
  topicName: string | null;
  examCode: ExamCode | null;
  companyName: string | null;
  paperCode: string | null;
  examYear: number | null;
  isAdaptive: boolean;
  instructions: string[];
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

// ============================================================
// Express Extensions
// ============================================================

declare global {
  namespace Express {
    interface User extends AppUser {}

    interface Request {
      user?: AppUser;
      sessionId?: string;
      tokenHash?: string;
    }
  }
}
