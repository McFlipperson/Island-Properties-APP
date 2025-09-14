// Expert Persona Types and Interfaces

export interface ExpertPersona {
  id: string;
  adminUserId?: string;
  expertName: string;
  expertStatus: 'developing' | 'active' | 'paused' | 'archived';
  expertiseFocus: string;
  targetBuyerSegments: string[];
  authorityLevel: 'emerging' | 'established' | 'recognized' | 'thought-leader';
  
  // Profile data (stored as encrypted in DB, but shown as plain text in UI)
  professionalBackground?: string;
  expertiseCredentials?: string;
  marketExperience?: string;
  
  // Geographic expertise
  primaryMarketLocation: string;
  secondaryMarketAreas: string[];
  localMarketKnowledgeDepth: number;
  timezone: string;
  
  // Content and authority configuration
  geoContentSpecializations: string[];
  authorityBuildingTopics: string[];
  citationWorthyExpertise: string[];
  
  // Platform strategy
  platformExpertiseFocus: PlatformExpertiseFocus;
  contentPublicationSchedule: ContentPublicationSchedule;
  expertVoiceCharacteristics: ExpertVoiceCharacteristics;
  
  // Security and browser config
  personaEncryptionKeyId: string;
  browserFingerprintConfig: BrowserFingerprintConfig;
  
  // Performance metrics
  currentAuthorityScore: number;
  estimatedAiCitations: number;
  expertRecognitionSignals: number;
  thoughtLeadershipReach: number;
  monthlyConsultationRequests: number;
  consultationToReferralRate: number;
  averageConsultationValue: number;
  
  // Timestamps
  createdAt: string;
  updatedAt: string;
  lastExpertActivity?: string;
}

export interface PlatformExpertiseFocus {
  medium?: {
    active: boolean;
    contentTypes: string[];
  };
  reddit?: {
    active: boolean;
    subreddits: string[];
  };
  quora?: {
    active: boolean;
    topics: string[];
  };
  facebook?: {
    active: boolean;
    groups: string[];
  };
  linkedin?: {
    active: boolean;
    contentTypes: string[];
  };
}

export interface ContentPublicationSchedule {
  frequency: 'daily' | 'weekly' | 'bi-weekly' | 'monthly';
  timezone: string;
  preferredTimes?: string[];
}

export interface ExpertVoiceCharacteristics {
  tone: 'professional' | 'friendly' | 'authoritative' | 'approachable';
  expertise_level: 'beginner-friendly' | 'intermediate' | 'advanced' | 'expert-only';
  target_audience: 'first-time-buyers' | 'investors' | 'expats' | 'locals' | 'all';
}

export interface BrowserFingerprintConfig {
  userAgent?: string;
  viewport?: {
    width: number;
    height: number;
  };
  timezone?: string;
  language?: string;
}

// Form-specific types for creation/editing
export interface ExpertPersonaFormData {
  expertName: string;
  expertiseFocus: ExpertiseFocus;
  targetBuyerSegments: string[];
  authorityLevel: AuthorityLevel;
  primaryMarketLocation: string;
  secondaryMarketAreas: string[];
  professionalBackground: string;
  expertiseCredentials: string;
  marketExperience: string;
  geoContentSpecializations: string[];
  authorityBuildingTopics: string[];
  citationWorthyExpertise: string[];
  platformExpertiseFocus: PlatformExpertiseFocus;
  contentPublicationSchedule: ContentPublicationSchedule;
  expertVoiceCharacteristics: ExpertVoiceCharacteristics;
  browserFingerprintConfig: BrowserFingerprintConfig;
}

// Philippines Real Estate Specializations
export type ExpertiseFocus = 
  | 'Manila Urban Property Expert'
  | 'Cebu Island Lifestyle Expert' 
  | 'Investment ROI Analysis Expert'
  | 'Expat Property Guidance Expert'
  | 'Philippines Market Analysis Expert';

export type AuthorityLevel = 
  | 'emerging'
  | 'established' 
  | 'recognized'
  | 'thought-leader';

export type ExpertStatus = 
  | 'developing'
  | 'active'
  | 'paused'
  | 'archived';

// Session Management Types
export interface ExpertSession {
  expertId: string;
  expertName: string;
  status: SessionStatus;
  startTime?: string;
  lastActivity?: string;
  platformConnections: PlatformConnectionStatus[];
  proxyStatus?: ProxyStatus;
}

export type SessionStatus = 
  | 'inactive'
  | 'ready'
  | 'active'
  | 'switching';

export interface PlatformConnectionStatus {
  platform: 'medium' | 'reddit' | 'quora' | 'facebook' | 'linkedin';
  connected: boolean;
  status: 'healthy' | 'warning' | 'error' | 'disconnected';
  lastCheck?: string;
}

export interface ProxyStatus {
  assigned: boolean;
  location?: string;
  status: 'active' | 'inactive' | 'error';
  provider?: 'proxy-cheap' | 'other';
}

// Dashboard Stats
export interface DashboardStats {
  totalExperts: number;
  activeExperts: number;
  activeSessions: number;
  authorityLevels: {
    emerging: number;
    established: number;
    recognized: number;
    'thought-leader': number;
  };
  totalConsultationRequests: number;
  averageAuthorityScore: number;
}

// Filter and Search Types
export interface ExpertFilters {
  expertiseFocus?: ExpertiseFocus[];
  authorityLevel?: AuthorityLevel[];
  expertStatus?: ExpertStatus[];
  primaryMarketLocation?: string[];
  searchQuery?: string;
}

// Export/Import Types
export interface ExpertExportData {
  experts: ExpertPersona[];
  exportDate: string;
  version: string;
}

export interface ExpertImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}