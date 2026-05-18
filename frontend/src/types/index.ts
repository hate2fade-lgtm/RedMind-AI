// User types
export interface User {
  id: number;
  email?: string;
  telegram_id?: string;
  username?: string;
  is_premium: boolean;
  premium_until?: string;
  free_analyses_used: number;
  total_analyses: number;
  created_at: string;
}

// Auth types
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Analysis types
export enum AnalysisType {
  FREE = 'free',
  SINGLE = 'single',
  EXTENDED = 'extended',
  PRO = 'pro',
}

export enum AnalysisStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export interface PersonalityAnalysis {
  archetype: string;
  strengths: string[];
  weaknesses: string[];
  communication_style: string;
  hidden_needs?: string[];
  vulnerabilities?: string[];
  attachment_trauma?: string;
}

export interface AnalysisCreate {
  input_text: string;
  source_type?: 'chat' | 'profile' | 'text';
  analysis_type: AnalysisType;
}

export interface Analysis {
  id: number;
  status: AnalysisStatus;
  analysis_type: AnalysisType;

  // Results
  toxicity_index?: number;
  manipulation_detected?: boolean;
  gaslighting_score?: number;

  emotional_dependency_a?: number;
  emotional_dependency_b?: number;
  dominant_side?: 'A' | 'B' | 'Equal';

  attachment_style_a?: string;
  attachment_style_b?: string;

  red_flags?: string[];
  personality_analysis?: PersonalityAnalysis;
  recommendations?: string[];

  // PRO fields
  return_probability?: number;
  dependency_winner?: string;
  breakup_initiator_prediction?: string;
  compatibility_score?: number;

  // Metadata
  processing_time?: number;
  report_url?: string;

  created_at: string;
  completed_at?: string;
}

export interface AnalysisListResponse {
  total: number;
  analyses: Analysis[];
}

// Stats types
export interface UserStats {
  total_analyses: number;
  free_analyses_remaining: number;
  is_premium: boolean;
  avg_toxicity?: number;
  most_common_red_flag?: string;
}

// API Error
export interface APIError {
  detail: string;
  error_code?: string;
}