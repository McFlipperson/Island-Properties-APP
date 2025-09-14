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
  
  // Proxy Configuration
  proxyProvider: varchar('proxy_provider', { length: 50 }).default('proxy-cheap'),
  proxyType: varchar('proxy_type', { length: 20 }).default('residential'),
  proxyLocation: varchar('proxy_location', { length: 50 }).notNull(),
  
  // Connection Details (Encrypted)
  proxyHostEncrypted: text('proxy_host_encrypted').notNull(),
  proxyPortEncrypted: text('proxy_port_encrypted').notNull(),
  proxyUsernameEncrypted: text('proxy_username_encrypted').notNull(),
  proxyPasswordEncrypted: text('proxy_password_encrypted').notNull(),
  
  // Proxy Status
  proxyStatus: varchar('proxy_status', { length: 20 }).default('active'),
  lastHealthCheck: timestamp('last_health_check'),
  healthCheckStatus: varchar('health_check_status', { length: 20 }),
  
  // Performance Metrics
  connectionSuccessRate: decimal('connection_success_rate', { precision: 5, scale: 2 }).default('0.00'),
  averageResponseTime: integer('average_response_time'),
  
  // Metadata
  assignedAt: timestamp('assigned_at').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
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