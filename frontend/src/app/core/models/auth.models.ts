export type AuthProvider = 'google' | 'phone';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface UserProfile {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  auth_provider: AuthProvider;
  is_verified: boolean;
  is_active: boolean;
  role: 'student' | 'admin' | 'moderator';
  created_at: string;
  updated_at: string;
}

export interface DeviceInfo {
  os: string;
  browser: string;
  ip: string;
  userAgent: string;
}

export interface SessionRecord {
  id: string;
  session_identifier: string;
  device_info: DeviceInfo;
  is_active: boolean;
  created_at: string;
  expires_at: string;
  last_active_at: string;
}

export interface AuthSuccessPayload {
  user: UserProfile;
  tokens: TokenPair;
}

export interface RefreshPayload {
  tokens: TokenPair;
}
