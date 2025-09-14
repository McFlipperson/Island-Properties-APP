import { pgTable, uuid, varchar, text, jsonb, integer, decimal, boolean, timestamp, index } from 'drizzle-orm/pg-core';
// import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Admin Users Table
export const adminUsers = pgTable('admin_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 100 }),
  role: varchar('role', { length: 20 }).default('admin'),
  status: varchar('status', { length: 20 }).default('active'),
  lastLogin: timestamp('last_login'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Expert Personas Table (Authority-Focused Real Estate Experts)
export const expertPersonas = pgTable('expert_personas', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminUserId: uuid('admin_user_id').references(() => adminUsers.id, { onDelete: 'cascade' }),
  
  // Core Expert Identity
  expertName: varchar('expert_name', { length: 100 }).notNull(),
  expertStatus: varchar('expert_status', { length: 20 }).default('developing'),
  
  // Real Estate Expertise Specialization
  expertiseFocus: varchar('expertise_focus', { length: 50 }).notNull(),
  targetBuyerSegments: jsonb('target_buyer_segments').notNull(),
  authorityLevel: varchar('authority_level', { length: 20 }).default('emerging'),
  
  // Expert Profile (Encrypted)
  professionalBackgroundEncrypted: text('professional_background_encrypted').notNull(),
  expertiseCredentialsEncrypted: text('expertise_credentials_encrypted').notNull(),
  marketExperienceEncrypted: text('market_experience_encrypted').notNull(),
  
  // Geographic Expertise (Philippines Focus)
  primaryMarketLocation: varchar('primary_market_location', { length: 50 }).notNull(),
  secondaryMarketAreas: jsonb('secondary_market_areas').default([]),
  localMarketKnowledgeDepth: integer('local_market_knowledge_depth').default(1),
  timezone: varchar('timezone', { length: 50 }).default('Asia/Manila'),
  
  // GEO Content Authority Configuration
  geoContentSpecializations: jsonb('geo_content_specializations').notNull(),
  authorityBuildingTopics: jsonb('authority_building_topics').notNull(),
  citationWorthyExpertise: jsonb('citation_worthy_expertise').notNull(),
  
  // Platform Authority Strategy
  platformExpertiseFocus: jsonb('platform_expertise_focus').notNull(),
  contentPublicationSchedule: jsonb('content_publication_schedule').notNull(),
  expertVoiceCharacteristics: jsonb('expert_voice_characteristics').notNull(),
  
  // Security Configuration
  personaEncryptionKeyId: varchar('persona_encryption_key_id', { length: 255 }).notNull(),
  browserFingerprintConfig: jsonb('browser_fingerprint_config').notNull(),
  
  // Authority Building Performance
  currentAuthorityScore: decimal('current_authority_score', { precision: 5, scale: 2 }).default('0.00'),
  estimatedAiCitations: integer('estimated_ai_citations').default(0),
  expertRecognitionSignals: integer('expert_recognition_signals').default(0),
  thoughtLeadershipReach: integer('thought_leadership_reach').default(0),
  
  // Lead Generation Through Expertise
  monthlyConsultationRequests: integer('monthly_consultation_requests').default(0),
  consultationToReferralRate: decimal('consultation_to_referral_rate', { precision: 5, scale: 4 }).default('0.0000'),
  averageConsultationValue: decimal('average_consultation_value', { precision: 8, scale: 2 }).default('0.00'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastExpertActivity: timestamp('last_expert_activity')
});

// GEO Platform Accounts
export const geoPlatformAccounts = pgTable('geo_platform_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  personaId: uuid('persona_id').references(() => expertPersonas.id, { onDelete: 'cascade' }),
  platformType: varchar('platform_type', { length: 50 }).notNull(),
  platformPriority: integer('platform_priority').notNull(),
  geoOptimizationLevel: varchar('geo_optimization_level', { length: 20 }).default('high'),
  
  // Account Details
  username: varchar('username', { length: 100 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  expertBio: text('expert_bio'),
  expertCredentials: text('expert_credentials'),
  profileOptimizationScore: decimal('profile_optimization_score', { precision: 3, scale: 2 }).default('0.00'),
  
  // Authentication (Encrypted)
  credentialsEncrypted: text('credentials_encrypted').notNull(),
  authTokensEncrypted: text('auth_tokens_encrypted'),
  
  // Account Authority Status
  accountStatus: varchar('account_status', { length: 20 }).default('building'),
  platformAuthorityLevel: varchar('platform_authority_level', { length: 20 }).default('newcomer'),
  expertVerificationStatus: varchar('expert_verification_status', { length: 20 }).default('unverified'),
  accountReputationScore: decimal('account_reputation_score', { precision: 5, scale: 2 }).default('0.00'),
  
  // Content Authority Metrics
  totalAuthorityContent: integer('total_authority_content').default(0),
  averageContentEngagement: decimal('average_content_engagement', { precision: 5, scale: 2 }).default('0.00'),
  expertRecognitionSignals: integer('expert_recognition_signals').default(0),
  thoughtLeadershipIndicators: integer('thought_leadership_indicators').default(0),
  
  // Platform-Specific GEO Configuration
  platformGeoSettings: jsonb('platform_geo_settings').notNull(),
  contentAuthorityStrategy: jsonb('content_authority_strategy').notNull(),
  expertEngagementApproach: jsonb('expert_engagement_approach').notNull(),
  citationOptimizationConfig: jsonb('citation_optimization_config').notNull(),
  
  // Authority-Based Lead Generation
  monthlyExpertInquiries: integer('monthly_expert_inquiries').default(0),
  consultationRequests: integer('consultation_requests').default(0),
  authorityConversionRate: decimal('authority_conversion_rate', { precision: 5, scale: 4 }).default('0.0000'),
  leadQualityFromAuthority: decimal('lead_quality_from_authority', { precision: 3, scale: 2 }).default('0.00'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastActivity: timestamp('last_activity')
});

// Authority Content Publications
export const authorityContentPublications = pgTable('authority_content_publications', {
  id: uuid('id').defaultRandom().primaryKey(),
  personaId: uuid('persona_id').references(() => expertPersonas.id, { onDelete: 'cascade' }),
  platformAccountId: uuid('platform_account_id').references(() => geoPlatformAccounts.id, { onDelete: 'cascade' }),
  
  // Content Details
  contentTitle: text('content_title').notNull(),
  contentType: varchar('content_type', { length: 50 }).notNull(),
  contentCategory: varchar('content_category', { length: 50 }),
  contentUrl: text('content_url'),
  
  // Content Authority Metrics
  contentLength: integer('content_length'),
  authorityScore: decimal('authority_score', { precision: 3, scale: 2 }).default('0.00'),
  aiCitationPotentialScore: decimal('ai_citation_potential_score', { precision: 3, scale: 2 }).default('0.00'),
  
  // Performance Tracking
  viewCount: integer('view_count').default(0),
  engagementCount: integer('engagement_count').default(0),
  shareCount: integer('share_count').default(0),
  expertRecognitionSignals: integer('expert_recognition_signals').default(0),
  
  // Lead Generation Attribution
  consultationInquiriesAttributed: integer('consultation_inquiries_attributed').default(0),
  leadConversionsAttributed: integer('lead_conversions_attributed').default(0),
  revenueAttributed: decimal('revenue_attributed', { precision: 10, scale: 2 }).default('0.00'),
  
  // Publication Status
  publicationStatus: varchar('publication_status', { length: 20 }).default('draft'),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Proxy Assignments
export const proxyAssignments = pgTable('proxy_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  personaId: uuid('persona_id').references(() => expertPersonas.id, { onDelete: 'cascade' }).unique(),
  
  // Proxy-Cheap Integration
  proxyCheapId: varchar('proxy_cheap_id', { length: 100 }),
  proxyProvider: varchar('proxy_provider', { length: 50 }).default('proxy-cheap'),
  proxyType: varchar('proxy_type', { length: 20 }).default('residential'),
  proxyLocation: varchar('proxy_location', { length: 50 }).notNull(),
  
  // Assignment Workflow Status
  assignmentStatus: varchar('assignment_status', { length: 20 }).default('unassigned'), // unassigned, requesting, testing, active, failed, maintenance
  
  // Connection Details (Encrypted)
  proxyHostEncrypted: text('proxy_host_encrypted'),
  proxyPortEncrypted: text('proxy_port_encrypted'),
  proxyUsernameEncrypted: text('proxy_username_encrypted'),
  proxyPasswordEncrypted: text('proxy_password_encrypted'),
  proxyCredentialsEncrypted: text('proxy_credentials_encrypted'), // Full credentials JSON encrypted
  
  // Geographic Validation (Philippines Focus)
  detectedCountry: varchar('detected_country', { length: 3 }), // ISO country code
  detectedCity: varchar('detected_city', { length: 100 }),
  detectedRegion: varchar('detected_region', { length: 100 }),
  isPhilippinesVerified: boolean('is_philippines_verified').default(false),
  geoValidationLastCheck: timestamp('geo_validation_last_check'),
  
  // IP Reputation & Security
  ipReputationScore: decimal('ip_reputation_score', { precision: 3, scale: 2 }),
  isResidentialVerified: boolean('is_residential_verified').default(false),
  blacklistCheckStatus: varchar('blacklist_check_status', { length: 20 }), // clean, flagged, unknown
  lastReputationCheck: timestamp('last_reputation_check'),
  
  // Health Monitoring
  proxyStatus: varchar('proxy_status', { length: 20 }).default('inactive'), // inactive, active, failed, maintenance
  lastHealthCheck: timestamp('last_health_check'),
  healthCheckStatus: varchar('health_check_status', { length: 20 }), // healthy, degraded, failed
  consecutiveFailures: integer('consecutive_failures').default(0),
  
  // Performance Metrics
  connectionSuccessRate: decimal('connection_success_rate', { precision: 5, scale: 2 }).default('0.00'),
  averageResponseTime: integer('average_response_time'),
  bandwidthUsageMb: decimal('bandwidth_usage_mb', { precision: 10, scale: 2 }).default('0.00'),
  totalRequests: integer('total_requests').default(0),
  failedRequests: integer('failed_requests').default(0),
  
  // Cost Management
  monthlyCostUsd: decimal('monthly_cost_usd', { precision: 6, scale: 2 }),
  dailyCostUsd: decimal('daily_cost_usd', { precision: 6, scale: 2 }),
  projectedMonthlyCost: decimal('projected_monthly_cost', { precision: 6, scale: 2 }),
  costTrackingStartDate: timestamp('cost_tracking_start_date'),
  lastCostUpdate: timestamp('last_cost_update'),
  
  // Security & Encryption
  encryptionKeyId: varchar('encryption_key_id', { length: 255 }),
  
  // Audit Trail
  assignmentReason: text('assignment_reason'),
  lastStatusChange: timestamp('last_status_change'),
  statusChangeReason: text('status_change_reason'),
  
  // Metadata
  assignedAt: timestamp('assigned_at'),
  activatedAt: timestamp('activated_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Expert Phone Numbers Table (Twilio Integration)
export const expertPhoneNumbers = pgTable('expert_phone_numbers', {
  id: uuid('id').defaultRandom().primaryKey(),
  personaId: uuid('persona_id').references(() => expertPersonas.id, { onDelete: 'cascade' }),
  
  // Twilio Phone Configuration
  twilioPhoneNumber: varchar('twilio_phone_number', { length: 20 }).notNull().unique(), // +63XXXXXXXXXX
  twilioPhoneSid: varchar('twilio_phone_sid', { length: 255 }).notNull().unique(),
  phoneNumberStatus: varchar('phone_number_status', { length: 20 }).default('provisioning'), // provisioning, active, suspended, failed
  
  // Phone Number Details
  countryCode: varchar('country_code', { length: 3 }).default('PH'),
  friendlyName: varchar('friendly_name', { length: 100 }),
  phoneNumberType: varchar('phone_number_type', { length: 20 }), // local, mobile, toll-free
  capabilities: jsonb('capabilities').notNull(), // voice, sms, mms capabilities
  
  // Expert Assignment
  assignmentStatus: varchar('assignment_status', { length: 20 }).default('assigned'), // assigned, unassigned, reserved
  assignedAt: timestamp('assigned_at').defaultNow(),
  
  // Cost Management
  monthlyCostUsd: decimal('monthly_cost_usd', { precision: 6, scale: 2 }),
  usageThisMonth: decimal('usage_this_month', { precision: 8, scale: 4 }).default('0.0000'),
  
  // Verification Configuration
  webhookUrl: varchar('webhook_url', { length: 500 }),
  verificationEnabled: boolean('verification_enabled').default(true),
  
  // Security & Encryption
  encryptionKeyId: varchar('encryption_key_id', { length: 255 }),
  
  // Health Monitoring
  lastHealthCheck: timestamp('last_health_check'),
  healthStatus: varchar('health_status', { length: 20 }).default('unknown'), // healthy, degraded, failed, unknown
  consecutiveFailures: integer('consecutive_failures').default(0),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastActivity: timestamp('last_activity')
});

// SMS Verification Sessions Table
export const smsVerificationSessions = pgTable('sms_verification_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  personaId: uuid('persona_id').references(() => expertPersonas.id, { onDelete: 'cascade' }),
  phoneNumberId: uuid('phone_number_id').references(() => expertPhoneNumbers.id, { onDelete: 'cascade' }),
  
  // Platform Context
  platformType: varchar('platform_type', { length: 50 }).notNull(), // medium, reddit, quora, facebook, linkedin
  platformAction: varchar('platform_action', { length: 50 }).notNull(), // signup, login, phone_verification, 2fa_setup
  
  // Session Management
  sessionStatus: varchar('session_status', { length: 20 }).default('active'), // active, completed, expired, failed
  sessionStartedAt: timestamp('session_started_at').defaultNow(),
  sessionExpiredAt: timestamp('session_expired_at'),
  
  // Expected Verification
  expectedCodePattern: varchar('expected_code_pattern', { length: 50 }), // 4-digit, 6-digit, 8-digit, alphanumeric
  maxRetries: integer('max_retries').default(3),
  attemptsRemaining: integer('attempts_remaining').default(3),
  
  // Session Metadata
  userAgent: text('user_agent'),
  ipAddress: varchar('ip_address', { length: 45 }),
  sessionNotes: text('session_notes'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  completedAt: timestamp('completed_at')
});

// SMS Messages Table (Incoming Verification SMS)
export const smsMessages = pgTable('sms_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => smsVerificationSessions.id, { onDelete: 'cascade' }),
  phoneNumberId: uuid('phone_number_id').references(() => expertPhoneNumbers.id, { onDelete: 'cascade' }),
  
  // Twilio Message Details
  twilioMessageSid: varchar('twilio_message_sid', { length: 255 }).notNull().unique(),
  fromPhoneNumber: varchar('from_phone_number', { length: 20 }).notNull(),
  toPhoneNumber: varchar('to_phone_number', { length: 20 }).notNull(),
  
  // Message Content
  messageBody: text('message_body').notNull(),
  messageDirection: varchar('message_direction', { length: 10 }).default('inbound'), // inbound, outbound
  messageStatus: varchar('message_status', { length: 20 }), // received, delivered, failed, etc.
  
  // Verification Code Extraction
  verificationCode: varchar('verification_code', { length: 20 }),
  codeConfidence: decimal('code_confidence', { precision: 3, scale: 2 }), // 0.00-1.00 confidence score
  codePattern: varchar('code_pattern', { length: 50 }), // detected pattern type
  
  // Platform Detection
  detectedPlatform: varchar('detected_platform', { length: 50 }),
  platformConfidence: decimal('platform_confidence', { precision: 3, scale: 2 }),
  
  // Processing Status
  processingStatus: varchar('processing_status', { length: 20 }).default('pending'), // pending, processed, failed, ignored
  processingNotes: text('processing_notes'),
  deliveredToDashboard: boolean('delivered_to_dashboard').default(false),
  
  // Metadata
  receivedAt: timestamp('received_at').defaultNow(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Verification Codes Table (Parsed and Validated Codes)
export const verificationCodes = pgTable('verification_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id').references(() => smsVerificationSessions.id, { onDelete: 'cascade' }),
  messageId: uuid('message_id').references(() => smsMessages.id, { onDelete: 'cascade' }),
  
  // Code Details
  verificationCode: varchar('verification_code', { length: 20 }).notNull(),
  codeType: varchar('code_type', { length: 20 }).notNull(), // numeric, alphanumeric, mixed
  codeLength: integer('code_length').notNull(),
  
  // Validation
  isValid: boolean('is_valid').default(true),
  validationScore: decimal('validation_score', { precision: 3, scale: 2 }),
  
  // Platform Context
  platformType: varchar('platform_type', { length: 50 }).notNull(),
  codeUsageType: varchar('code_usage_type', { length: 50 }), // phone_verification, 2fa, login, signup
  
  // Status Tracking
  codeStatus: varchar('code_status', { length: 20 }).default('active'), // active, used, expired, invalid
  usedAt: timestamp('used_at'),
  expiresAt: timestamp('expires_at'),
  
  // Dashboard Delivery
  sentToDashboard: boolean('sent_to_dashboard').default(false),
  dashboardDeliveryAt: timestamp('dashboard_delivery_at'),
  viewedByUser: boolean('viewed_by_user').default(false),
  viewedAt: timestamp('viewed_at'),
  
  // Metadata
  extractedAt: timestamp('extracted_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

// SMS Webhook Events Table (Audit Trail)
export const smsWebhookEvents = pgTable('sms_webhook_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // Webhook Details
  webhookEventType: varchar('webhook_event_type', { length: 50 }).notNull(), // message_received, delivery_status, etc.
  twilioEventSid: varchar('twilio_event_sid', { length: 255 }),
  
  // Request Details
  requestBody: jsonb('request_body').notNull(),
  requestHeaders: jsonb('request_headers'),
  sourceIp: varchar('source_ip', { length: 45 }),
  
  // Processing Status
  processingStatus: varchar('processing_status', { length: 20 }).default('pending'), // pending, processed, failed
  processingError: text('processing_error'),
  processingDuration: integer('processing_duration'), // milliseconds
  
  // Associated Records
  messageId: uuid('message_id').references(() => smsMessages.id),
  sessionId: uuid('session_id').references(() => smsVerificationSessions.id),
  
  // Metadata
  receivedAt: timestamp('received_at').defaultNow(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow()
});

// Indexes
export const expertPersonasNameIdx = index('idx_expert_personas_name').on(expertPersonas.expertName);
export const expertPersonasStatusIdx = index('idx_expert_personas_status').on(expertPersonas.expertStatus);
export const expertPersonasAuthorityIdx = index('idx_expert_personas_authority').on(expertPersonas.authorityLevel);

export const geoPlatformAccountsPersonaIdx = index('idx_geo_platform_accounts_persona').on(geoPlatformAccounts.personaId);
export const geoPlatformAccountsPlatformIdx = index('idx_geo_platform_accounts_platform').on(geoPlatformAccounts.platformType);

export const contentPublicationsPersonaIdx = index('idx_content_publications_persona').on(authorityContentPublications.personaId);
export const contentPublicationsPlatformIdx = index('idx_content_publications_platform').on(authorityContentPublications.platformAccountId);

export const proxyAssignmentsPersonaIdx = index('idx_proxy_assignments_persona').on(proxyAssignments.personaId);

// Twilio SMS Indexes
export const expertPhoneNumbersPersonaIdx = index('idx_expert_phone_numbers_persona').on(expertPhoneNumbers.personaId);
export const expertPhoneNumbersStatusIdx = index('idx_expert_phone_numbers_status').on(expertPhoneNumbers.phoneNumberStatus);
export const expertPhoneNumbersTwilioNumberIdx = index('idx_expert_phone_numbers_twilio').on(expertPhoneNumbers.twilioPhoneNumber);

export const smsVerificationSessionsPersonaIdx = index('idx_sms_verification_sessions_persona').on(smsVerificationSessions.personaId);
export const smsVerificationSessionsPhoneIdx = index('idx_sms_verification_sessions_phone').on(smsVerificationSessions.phoneNumberId);
export const smsVerificationSessionsStatusIdx = index('idx_sms_verification_sessions_status').on(smsVerificationSessions.sessionStatus);

export const smsMessagesSessionIdx = index('idx_sms_messages_session').on(smsMessages.sessionId);
export const smsMessagesPhoneIdx = index('idx_sms_messages_phone').on(smsMessages.phoneNumberId);
export const smsMessagesTwilioSidIdx = index('idx_sms_messages_twilio_sid').on(smsMessages.twilioMessageSid);

export const verificationCodesSessionIdx = index('idx_verification_codes_session').on(verificationCodes.sessionId);
export const verificationCodesStatusIdx = index('idx_verification_codes_status').on(verificationCodes.codeStatus);

export const smsWebhookEventsTypeIdx = index('idx_sms_webhook_events_type').on(smsWebhookEvents.webhookEventType);

// Zod schemas - will add later once drizzle-zod is properly configured
// export const insertAdminUserSchema = createInsertSchema(adminUsers);
// export const selectAdminUserSchema = createSelectSchema(adminUsers);

// Types
export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

export type ExpertPersona = typeof expertPersonas.$inferSelect;
export type NewExpertPersona = typeof expertPersonas.$inferInsert;

export type GeoPlatformAccount = typeof geoPlatformAccounts.$inferSelect;
export type NewGeoPlatformAccount = typeof geoPlatformAccounts.$inferInsert;

export type AuthorityContentPublication = typeof authorityContentPublications.$inferSelect;
export type NewAuthorityContentPublication = typeof authorityContentPublications.$inferInsert;

export type ProxyAssignment = typeof proxyAssignments.$inferSelect;
export type NewProxyAssignment = typeof proxyAssignments.$inferInsert;

export type ExpertPhoneNumber = typeof expertPhoneNumbers.$inferSelect;
export type NewExpertPhoneNumber = typeof expertPhoneNumbers.$inferInsert;

export type SmsVerificationSession = typeof smsVerificationSessions.$inferSelect;
export type NewSmsVerificationSession = typeof smsVerificationSessions.$inferInsert;

export type SmsMessage = typeof smsMessages.$inferSelect;
export type NewSmsMessage = typeof smsMessages.$inferInsert;

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;

export type SmsWebhookEvent = typeof smsWebhookEvents.$inferSelect;
export type NewSmsWebhookEvent = typeof smsWebhookEvents.$inferInsert;