"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.proxyAssignmentsPersonaIdx = exports.contentPublicationsPlatformIdx = exports.contentPublicationsPersonaIdx = exports.geoPlatformAccountsPlatformIdx = exports.geoPlatformAccountsPersonaIdx = exports.expertPersonasAuthorityIdx = exports.expertPersonasStatusIdx = exports.expertPersonasNameIdx = exports.proxyAssignments = exports.authorityContentPublications = exports.geoPlatformAccounts = exports.expertPersonas = exports.adminUsers = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
// Admin Users Table
exports.adminUsers = (0, pg_core_1.pgTable)('admin_users', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    username: (0, pg_core_1.varchar)('username', { length: 50 }).notNull().unique(),
    email: (0, pg_core_1.varchar)('email', { length: 255 }).notNull().unique(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    fullName: (0, pg_core_1.varchar)('full_name', { length: 100 }),
    role: (0, pg_core_1.varchar)('role', { length: 20 }).default('admin'),
    status: (0, pg_core_1.varchar)('status', { length: 20 }).default('active'),
    lastLogin: (0, pg_core_1.timestamp)('last_login'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow()
});
// Expert Personas Table (Authority-Focused Real Estate Experts)
exports.expertPersonas = (0, pg_core_1.pgTable)('expert_personas', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    adminUserId: (0, pg_core_1.uuid)('admin_user_id').references(() => exports.adminUsers.id, { onDelete: 'cascade' }),
    // Core Expert Identity
    expertName: (0, pg_core_1.varchar)('expert_name', { length: 100 }).notNull(),
    expertStatus: (0, pg_core_1.varchar)('expert_status', { length: 20 }).default('developing'),
    // Real Estate Expertise Specialization
    expertiseFocus: (0, pg_core_1.varchar)('expertise_focus', { length: 50 }).notNull(),
    targetBuyerSegments: (0, pg_core_1.jsonb)('target_buyer_segments').notNull(),
    authorityLevel: (0, pg_core_1.varchar)('authority_level', { length: 20 }).default('emerging'),
    // Expert Profile (Encrypted)
    professionalBackgroundEncrypted: (0, pg_core_1.text)('professional_background_encrypted').notNull(),
    expertiseCredentialsEncrypted: (0, pg_core_1.text)('expertise_credentials_encrypted').notNull(),
    marketExperienceEncrypted: (0, pg_core_1.text)('market_experience_encrypted').notNull(),
    // Geographic Expertise (Philippines Focus)
    primaryMarketLocation: (0, pg_core_1.varchar)('primary_market_location', { length: 50 }).notNull(),
    secondaryMarketAreas: (0, pg_core_1.jsonb)('secondary_market_areas').default([]),
    localMarketKnowledgeDepth: (0, pg_core_1.integer)('local_market_knowledge_depth').default(1),
    timezone: (0, pg_core_1.varchar)('timezone', { length: 50 }).default('Asia/Manila'),
    // GEO Content Authority Configuration
    geoContentSpecializations: (0, pg_core_1.jsonb)('geo_content_specializations').notNull(),
    authorityBuildingTopics: (0, pg_core_1.jsonb)('authority_building_topics').notNull(),
    citationWorthyExpertise: (0, pg_core_1.jsonb)('citation_worthy_expertise').notNull(),
    // Platform Authority Strategy
    platformExpertiseFocus: (0, pg_core_1.jsonb)('platform_expertise_focus').notNull(),
    contentPublicationSchedule: (0, pg_core_1.jsonb)('content_publication_schedule').notNull(),
    expertVoiceCharacteristics: (0, pg_core_1.jsonb)('expert_voice_characteristics').notNull(),
    // Security Configuration
    personaEncryptionKeyId: (0, pg_core_1.varchar)('persona_encryption_key_id', { length: 255 }).notNull(),
    browserFingerprintConfig: (0, pg_core_1.jsonb)('browser_fingerprint_config').notNull(),
    // Authority Building Performance
    currentAuthorityScore: (0, pg_core_1.decimal)('current_authority_score', { precision: 5, scale: 2 }).default('0.00'),
    estimatedAiCitations: (0, pg_core_1.integer)('estimated_ai_citations').default(0),
    expertRecognitionSignals: (0, pg_core_1.integer)('expert_recognition_signals').default(0),
    thoughtLeadershipReach: (0, pg_core_1.integer)('thought_leadership_reach').default(0),
    // Lead Generation Through Expertise
    monthlyConsultationRequests: (0, pg_core_1.integer)('monthly_consultation_requests').default(0),
    consultationToReferralRate: (0, pg_core_1.decimal)('consultation_to_referral_rate', { precision: 5, scale: 4 }).default('0.0000'),
    averageConsultationValue: (0, pg_core_1.decimal)('average_consultation_value', { precision: 8, scale: 2 }).default('0.00'),
    // Metadata
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
    lastExpertActivity: (0, pg_core_1.timestamp)('last_expert_activity')
});
// GEO Platform Accounts
exports.geoPlatformAccounts = (0, pg_core_1.pgTable)('geo_platform_accounts', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    personaId: (0, pg_core_1.uuid)('persona_id').references(() => exports.expertPersonas.id, { onDelete: 'cascade' }),
    platformType: (0, pg_core_1.varchar)('platform_type', { length: 50 }).notNull(),
    platformPriority: (0, pg_core_1.integer)('platform_priority').notNull(),
    geoOptimizationLevel: (0, pg_core_1.varchar)('geo_optimization_level', { length: 20 }).default('high'),
    // Account Details
    username: (0, pg_core_1.varchar)('username', { length: 100 }).notNull(),
    displayName: (0, pg_core_1.varchar)('display_name', { length: 100 }),
    expertBio: (0, pg_core_1.text)('expert_bio'),
    expertCredentials: (0, pg_core_1.text)('expert_credentials'),
    profileOptimizationScore: (0, pg_core_1.decimal)('profile_optimization_score', { precision: 3, scale: 2 }).default('0.00'),
    // Authentication (Encrypted)
    credentialsEncrypted: (0, pg_core_1.text)('credentials_encrypted').notNull(),
    authTokensEncrypted: (0, pg_core_1.text)('auth_tokens_encrypted'),
    // Account Authority Status
    accountStatus: (0, pg_core_1.varchar)('account_status', { length: 20 }).default('building'),
    platformAuthorityLevel: (0, pg_core_1.varchar)('platform_authority_level', { length: 20 }).default('newcomer'),
    expertVerificationStatus: (0, pg_core_1.varchar)('expert_verification_status', { length: 20 }).default('unverified'),
    accountReputationScore: (0, pg_core_1.decimal)('account_reputation_score', { precision: 5, scale: 2 }).default('0.00'),
    // Content Authority Metrics
    totalAuthorityContent: (0, pg_core_1.integer)('total_authority_content').default(0),
    averageContentEngagement: (0, pg_core_1.decimal)('average_content_engagement', { precision: 5, scale: 2 }).default('0.00'),
    expertRecognitionSignals: (0, pg_core_1.integer)('expert_recognition_signals').default(0),
    thoughtLeadershipIndicators: (0, pg_core_1.integer)('thought_leadership_indicators').default(0),
    // Platform-Specific GEO Configuration
    platformGeoSettings: (0, pg_core_1.jsonb)('platform_geo_settings').notNull(),
    contentAuthorityStrategy: (0, pg_core_1.jsonb)('content_authority_strategy').notNull(),
    expertEngagementApproach: (0, pg_core_1.jsonb)('expert_engagement_approach').notNull(),
    citationOptimizationConfig: (0, pg_core_1.jsonb)('citation_optimization_config').notNull(),
    // Authority-Based Lead Generation
    monthlyExpertInquiries: (0, pg_core_1.integer)('monthly_expert_inquiries').default(0),
    consultationRequests: (0, pg_core_1.integer)('consultation_requests').default(0),
    authorityConversionRate: (0, pg_core_1.decimal)('authority_conversion_rate', { precision: 5, scale: 4 }).default('0.0000'),
    leadQualityFromAuthority: (0, pg_core_1.decimal)('lead_quality_from_authority', { precision: 3, scale: 2 }).default('0.00'),
    // Metadata
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
    lastActivity: (0, pg_core_1.timestamp)('last_activity')
});
// Authority Content Publications
exports.authorityContentPublications = (0, pg_core_1.pgTable)('authority_content_publications', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    personaId: (0, pg_core_1.uuid)('persona_id').references(() => exports.expertPersonas.id, { onDelete: 'cascade' }),
    platformAccountId: (0, pg_core_1.uuid)('platform_account_id').references(() => exports.geoPlatformAccounts.id, { onDelete: 'cascade' }),
    // Content Details
    contentTitle: (0, pg_core_1.text)('content_title').notNull(),
    contentType: (0, pg_core_1.varchar)('content_type', { length: 50 }).notNull(),
    contentCategory: (0, pg_core_1.varchar)('content_category', { length: 50 }),
    contentUrl: (0, pg_core_1.text)('content_url'),
    // Content Authority Metrics
    contentLength: (0, pg_core_1.integer)('content_length'),
    authorityScore: (0, pg_core_1.decimal)('authority_score', { precision: 3, scale: 2 }).default('0.00'),
    aiCitationPotentialScore: (0, pg_core_1.decimal)('ai_citation_potential_score', { precision: 3, scale: 2 }).default('0.00'),
    // Performance Tracking
    viewCount: (0, pg_core_1.integer)('view_count').default(0),
    engagementCount: (0, pg_core_1.integer)('engagement_count').default(0),
    shareCount: (0, pg_core_1.integer)('share_count').default(0),
    expertRecognitionSignals: (0, pg_core_1.integer)('expert_recognition_signals').default(0),
    // Lead Generation Attribution
    consultationInquiriesAttributed: (0, pg_core_1.integer)('consultation_inquiries_attributed').default(0),
    leadConversionsAttributed: (0, pg_core_1.integer)('lead_conversions_attributed').default(0),
    revenueAttributed: (0, pg_core_1.decimal)('revenue_attributed', { precision: 10, scale: 2 }).default('0.00'),
    // Publication Status
    publicationStatus: (0, pg_core_1.varchar)('publication_status', { length: 20 }).default('draft'),
    publishedAt: (0, pg_core_1.timestamp)('published_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow()
});
// Proxy Assignments
exports.proxyAssignments = (0, pg_core_1.pgTable)('proxy_assignments', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    personaId: (0, pg_core_1.uuid)('persona_id').references(() => exports.expertPersonas.id, { onDelete: 'cascade' }).unique(),
    // Proxy Configuration
    proxyProvider: (0, pg_core_1.varchar)('proxy_provider', { length: 50 }).default('proxy-cheap'),
    proxyType: (0, pg_core_1.varchar)('proxy_type', { length: 20 }).default('residential'),
    proxyLocation: (0, pg_core_1.varchar)('proxy_location', { length: 50 }).notNull(),
    // Connection Details (Encrypted)
    proxyHostEncrypted: (0, pg_core_1.text)('proxy_host_encrypted').notNull(),
    proxyPortEncrypted: (0, pg_core_1.text)('proxy_port_encrypted').notNull(),
    proxyUsernameEncrypted: (0, pg_core_1.text)('proxy_username_encrypted').notNull(),
    proxyPasswordEncrypted: (0, pg_core_1.text)('proxy_password_encrypted').notNull(),
    // Proxy Status
    proxyStatus: (0, pg_core_1.varchar)('proxy_status', { length: 20 }).default('active'),
    lastHealthCheck: (0, pg_core_1.timestamp)('last_health_check'),
    healthCheckStatus: (0, pg_core_1.varchar)('health_check_status', { length: 20 }),
    // Performance Metrics
    connectionSuccessRate: (0, pg_core_1.decimal)('connection_success_rate', { precision: 5, scale: 2 }).default('0.00'),
    averageResponseTime: (0, pg_core_1.integer)('average_response_time'),
    // Metadata
    assignedAt: (0, pg_core_1.timestamp)('assigned_at').defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow()
});
// Indexes
exports.expertPersonasNameIdx = (0, pg_core_1.index)('idx_expert_personas_name').on(exports.expertPersonas.expertName);
exports.expertPersonasStatusIdx = (0, pg_core_1.index)('idx_expert_personas_status').on(exports.expertPersonas.expertStatus);
exports.expertPersonasAuthorityIdx = (0, pg_core_1.index)('idx_expert_personas_authority').on(exports.expertPersonas.authorityLevel);
exports.geoPlatformAccountsPersonaIdx = (0, pg_core_1.index)('idx_geo_platform_accounts_persona').on(exports.geoPlatformAccounts.personaId);
exports.geoPlatformAccountsPlatformIdx = (0, pg_core_1.index)('idx_geo_platform_accounts_platform').on(exports.geoPlatformAccounts.platformType);
exports.contentPublicationsPersonaIdx = (0, pg_core_1.index)('idx_content_publications_persona').on(exports.authorityContentPublications.personaId);
exports.contentPublicationsPlatformIdx = (0, pg_core_1.index)('idx_content_publications_platform').on(exports.authorityContentPublications.platformAccountId);
exports.proxyAssignmentsPersonaIdx = (0, pg_core_1.index)('idx_proxy_assignments_persona').on(exports.proxyAssignments.personaId);
//# sourceMappingURL=schema.js.map