"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.smsWebhookEventsTypeIdx = exports.verificationCodesStatusIdx = exports.verificationCodesSessionIdx = exports.smsMessagesTwilioSidIdx = exports.smsMessagesPhoneIdx = exports.smsMessagesSessionIdx = exports.smsVerificationSessionsStatusIdx = exports.smsVerificationSessionsPhoneIdx = exports.smsVerificationSessionsPersonaIdx = exports.expertPhoneNumbersTwilioNumberIdx = exports.expertPhoneNumbersStatusIdx = exports.expertPhoneNumbersPersonaIdx = exports.proxyAssignmentsPersonaIdx = exports.contentPublicationsPlatformIdx = exports.contentPublicationsPersonaIdx = exports.geoPlatformAccountsPlatformIdx = exports.geoPlatformAccountsPersonaIdx = exports.expertPersonasAuthorityIdx = exports.expertPersonasStatusIdx = exports.expertPersonasNameIdx = exports.smsWebhookEvents = exports.verificationCodes = exports.smsMessages = exports.smsVerificationSessions = exports.expertPhoneNumbers = exports.proxyAssignments = exports.authorityContentPublications = exports.geoPlatformAccounts = exports.expertPersonas = exports.adminUsers = void 0;
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
    // Proxy-Cheap Integration
    proxyCheapId: (0, pg_core_1.varchar)('proxy_cheap_id', { length: 100 }),
    proxyProvider: (0, pg_core_1.varchar)('proxy_provider', { length: 50 }).default('proxy-cheap'),
    proxyType: (0, pg_core_1.varchar)('proxy_type', { length: 20 }).default('residential'),
    proxyLocation: (0, pg_core_1.varchar)('proxy_location', { length: 50 }).notNull(),
    // Assignment Workflow Status
    assignmentStatus: (0, pg_core_1.varchar)('assignment_status', { length: 20 }).default('unassigned'), // unassigned, requesting, testing, active, failed, maintenance
    // Connection Details (Encrypted)
    proxyHostEncrypted: (0, pg_core_1.text)('proxy_host_encrypted'),
    proxyPortEncrypted: (0, pg_core_1.text)('proxy_port_encrypted'),
    proxyUsernameEncrypted: (0, pg_core_1.text)('proxy_username_encrypted'),
    proxyPasswordEncrypted: (0, pg_core_1.text)('proxy_password_encrypted'),
    proxyCredentialsEncrypted: (0, pg_core_1.text)('proxy_credentials_encrypted'), // Full credentials JSON encrypted
    // Geographic Validation (Philippines Focus)
    detectedCountry: (0, pg_core_1.varchar)('detected_country', { length: 3 }), // ISO country code
    detectedCity: (0, pg_core_1.varchar)('detected_city', { length: 100 }),
    detectedRegion: (0, pg_core_1.varchar)('detected_region', { length: 100 }),
    isPhilippinesVerified: (0, pg_core_1.boolean)('is_philippines_verified').default(false),
    geoValidationLastCheck: (0, pg_core_1.timestamp)('geo_validation_last_check'),
    // IP Reputation & Security
    ipReputationScore: (0, pg_core_1.decimal)('ip_reputation_score', { precision: 3, scale: 2 }),
    isResidentialVerified: (0, pg_core_1.boolean)('is_residential_verified').default(false),
    blacklistCheckStatus: (0, pg_core_1.varchar)('blacklist_check_status', { length: 20 }), // clean, flagged, unknown
    lastReputationCheck: (0, pg_core_1.timestamp)('last_reputation_check'),
    // Health Monitoring
    proxyStatus: (0, pg_core_1.varchar)('proxy_status', { length: 20 }).default('inactive'), // inactive, active, failed, maintenance
    lastHealthCheck: (0, pg_core_1.timestamp)('last_health_check'),
    healthCheckStatus: (0, pg_core_1.varchar)('health_check_status', { length: 20 }), // healthy, degraded, failed
    consecutiveFailures: (0, pg_core_1.integer)('consecutive_failures').default(0),
    // Performance Metrics
    connectionSuccessRate: (0, pg_core_1.decimal)('connection_success_rate', { precision: 5, scale: 2 }).default('0.00'),
    averageResponseTime: (0, pg_core_1.integer)('average_response_time'),
    bandwidthUsageMb: (0, pg_core_1.decimal)('bandwidth_usage_mb', { precision: 10, scale: 2 }).default('0.00'),
    totalRequests: (0, pg_core_1.integer)('total_requests').default(0),
    failedRequests: (0, pg_core_1.integer)('failed_requests').default(0),
    // Cost Management
    monthlyCostUsd: (0, pg_core_1.decimal)('monthly_cost_usd', { precision: 6, scale: 2 }),
    dailyCostUsd: (0, pg_core_1.decimal)('daily_cost_usd', { precision: 6, scale: 2 }),
    projectedMonthlyCost: (0, pg_core_1.decimal)('projected_monthly_cost', { precision: 6, scale: 2 }),
    costTrackingStartDate: (0, pg_core_1.timestamp)('cost_tracking_start_date'),
    lastCostUpdate: (0, pg_core_1.timestamp)('last_cost_update'),
    // Security & Encryption
    encryptionKeyId: (0, pg_core_1.varchar)('encryption_key_id', { length: 255 }),
    // Audit Trail
    assignmentReason: (0, pg_core_1.text)('assignment_reason'),
    lastStatusChange: (0, pg_core_1.timestamp)('last_status_change'),
    statusChangeReason: (0, pg_core_1.text)('status_change_reason'),
    // Metadata
    assignedAt: (0, pg_core_1.timestamp)('assigned_at'),
    activatedAt: (0, pg_core_1.timestamp)('activated_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow()
});
// Expert Phone Numbers Table (Twilio Integration)
exports.expertPhoneNumbers = (0, pg_core_1.pgTable)('expert_phone_numbers', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    personaId: (0, pg_core_1.uuid)('persona_id').references(() => exports.expertPersonas.id, { onDelete: 'cascade' }),
    // Twilio Phone Configuration
    twilioPhoneNumber: (0, pg_core_1.varchar)('twilio_phone_number', { length: 20 }).notNull().unique(), // +63XXXXXXXXXX
    twilioPhoneSid: (0, pg_core_1.varchar)('twilio_phone_sid', { length: 255 }).notNull().unique(),
    phoneNumberStatus: (0, pg_core_1.varchar)('phone_number_status', { length: 20 }).default('provisioning'), // provisioning, active, suspended, failed
    // Phone Number Details
    countryCode: (0, pg_core_1.varchar)('country_code', { length: 3 }).default('PH'),
    friendlyName: (0, pg_core_1.varchar)('friendly_name', { length: 100 }),
    phoneNumberType: (0, pg_core_1.varchar)('phone_number_type', { length: 20 }), // local, mobile, toll-free
    capabilities: (0, pg_core_1.jsonb)('capabilities').notNull(), // voice, sms, mms capabilities
    // Expert Assignment
    assignmentStatus: (0, pg_core_1.varchar)('assignment_status', { length: 20 }).default('assigned'), // assigned, unassigned, reserved
    assignedAt: (0, pg_core_1.timestamp)('assigned_at').defaultNow(),
    // Cost Management
    monthlyCostUsd: (0, pg_core_1.decimal)('monthly_cost_usd', { precision: 6, scale: 2 }),
    usageThisMonth: (0, pg_core_1.decimal)('usage_this_month', { precision: 8, scale: 4 }).default('0.0000'),
    // Verification Configuration
    webhookUrl: (0, pg_core_1.varchar)('webhook_url', { length: 500 }),
    verificationEnabled: (0, pg_core_1.boolean)('verification_enabled').default(true),
    // Security & Encryption
    encryptionKeyId: (0, pg_core_1.varchar)('encryption_key_id', { length: 255 }),
    // Health Monitoring
    lastHealthCheck: (0, pg_core_1.timestamp)('last_health_check'),
    healthStatus: (0, pg_core_1.varchar)('health_status', { length: 20 }).default('unknown'), // healthy, degraded, failed, unknown
    consecutiveFailures: (0, pg_core_1.integer)('consecutive_failures').default(0),
    // Metadata
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
    lastActivity: (0, pg_core_1.timestamp)('last_activity')
});
// SMS Verification Sessions Table
exports.smsVerificationSessions = (0, pg_core_1.pgTable)('sms_verification_sessions', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    personaId: (0, pg_core_1.uuid)('persona_id').references(() => exports.expertPersonas.id, { onDelete: 'cascade' }),
    phoneNumberId: (0, pg_core_1.uuid)('phone_number_id').references(() => exports.expertPhoneNumbers.id, { onDelete: 'cascade' }),
    // Platform Context
    platformType: (0, pg_core_1.varchar)('platform_type', { length: 50 }).notNull(), // medium, reddit, quora, facebook, linkedin
    platformAction: (0, pg_core_1.varchar)('platform_action', { length: 50 }).notNull(), // signup, login, phone_verification, 2fa_setup
    // Session Management
    sessionStatus: (0, pg_core_1.varchar)('session_status', { length: 20 }).default('active'), // active, completed, expired, failed
    sessionStartedAt: (0, pg_core_1.timestamp)('session_started_at').defaultNow(),
    sessionExpiredAt: (0, pg_core_1.timestamp)('session_expired_at'),
    // Expected Verification
    expectedCodePattern: (0, pg_core_1.varchar)('expected_code_pattern', { length: 50 }), // 4-digit, 6-digit, 8-digit, alphanumeric
    maxRetries: (0, pg_core_1.integer)('max_retries').default(3),
    attemptsRemaining: (0, pg_core_1.integer)('attempts_remaining').default(3),
    // Session Metadata
    userAgent: (0, pg_core_1.text)('user_agent'),
    ipAddress: (0, pg_core_1.varchar)('ip_address', { length: 45 }),
    sessionNotes: (0, pg_core_1.text)('session_notes'),
    // Metadata
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at').defaultNow(),
    completedAt: (0, pg_core_1.timestamp)('completed_at')
});
// SMS Messages Table (Incoming Verification SMS)
exports.smsMessages = (0, pg_core_1.pgTable)('sms_messages', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    sessionId: (0, pg_core_1.uuid)('session_id').references(() => exports.smsVerificationSessions.id, { onDelete: 'cascade' }),
    phoneNumberId: (0, pg_core_1.uuid)('phone_number_id').references(() => exports.expertPhoneNumbers.id, { onDelete: 'cascade' }),
    // Twilio Message Details
    twilioMessageSid: (0, pg_core_1.varchar)('twilio_message_sid', { length: 255 }).notNull().unique(),
    fromPhoneNumber: (0, pg_core_1.varchar)('from_phone_number', { length: 20 }).notNull(),
    toPhoneNumber: (0, pg_core_1.varchar)('to_phone_number', { length: 20 }).notNull(),
    // Message Content
    messageBody: (0, pg_core_1.text)('message_body').notNull(),
    messageDirection: (0, pg_core_1.varchar)('message_direction', { length: 10 }).default('inbound'), // inbound, outbound
    messageStatus: (0, pg_core_1.varchar)('message_status', { length: 20 }), // received, delivered, failed, etc.
    // Verification Code Extraction
    verificationCode: (0, pg_core_1.varchar)('verification_code', { length: 20 }),
    codeConfidence: (0, pg_core_1.decimal)('code_confidence', { precision: 3, scale: 2 }), // 0.00-1.00 confidence score
    codePattern: (0, pg_core_1.varchar)('code_pattern', { length: 50 }), // detected pattern type
    // Platform Detection
    detectedPlatform: (0, pg_core_1.varchar)('detected_platform', { length: 50 }),
    platformConfidence: (0, pg_core_1.decimal)('platform_confidence', { precision: 3, scale: 2 }),
    // Processing Status
    processingStatus: (0, pg_core_1.varchar)('processing_status', { length: 20 }).default('pending'), // pending, processed, failed, ignored
    processingNotes: (0, pg_core_1.text)('processing_notes'),
    deliveredToDashboard: (0, pg_core_1.boolean)('delivered_to_dashboard').default(false),
    // Metadata
    receivedAt: (0, pg_core_1.timestamp)('received_at').defaultNow(),
    processedAt: (0, pg_core_1.timestamp)('processed_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
// Verification Codes Table (Parsed and Validated Codes)
exports.verificationCodes = (0, pg_core_1.pgTable)('verification_codes', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    sessionId: (0, pg_core_1.uuid)('session_id').references(() => exports.smsVerificationSessions.id, { onDelete: 'cascade' }),
    messageId: (0, pg_core_1.uuid)('message_id').references(() => exports.smsMessages.id, { onDelete: 'cascade' }),
    // Code Details
    verificationCode: (0, pg_core_1.varchar)('verification_code', { length: 20 }).notNull(),
    codeType: (0, pg_core_1.varchar)('code_type', { length: 20 }).notNull(), // numeric, alphanumeric, mixed
    codeLength: (0, pg_core_1.integer)('code_length').notNull(),
    // Validation
    isValid: (0, pg_core_1.boolean)('is_valid').default(true),
    validationScore: (0, pg_core_1.decimal)('validation_score', { precision: 3, scale: 2 }),
    // Platform Context
    platformType: (0, pg_core_1.varchar)('platform_type', { length: 50 }).notNull(),
    codeUsageType: (0, pg_core_1.varchar)('code_usage_type', { length: 50 }), // phone_verification, 2fa, login, signup
    // Status Tracking
    codeStatus: (0, pg_core_1.varchar)('code_status', { length: 20 }).default('active'), // active, used, expired, invalid
    usedAt: (0, pg_core_1.timestamp)('used_at'),
    expiresAt: (0, pg_core_1.timestamp)('expires_at'),
    // Dashboard Delivery
    sentToDashboard: (0, pg_core_1.boolean)('sent_to_dashboard').default(false),
    dashboardDeliveryAt: (0, pg_core_1.timestamp)('dashboard_delivery_at'),
    viewedByUser: (0, pg_core_1.boolean)('viewed_by_user').default(false),
    viewedAt: (0, pg_core_1.timestamp)('viewed_at'),
    // Metadata
    extractedAt: (0, pg_core_1.timestamp)('extracted_at').defaultNow(),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
});
// SMS Webhook Events Table (Audit Trail)
exports.smsWebhookEvents = (0, pg_core_1.pgTable)('sms_webhook_events', {
    id: (0, pg_core_1.uuid)('id').defaultRandom().primaryKey(),
    // Webhook Details
    webhookEventType: (0, pg_core_1.varchar)('webhook_event_type', { length: 50 }).notNull(), // message_received, delivery_status, etc.
    twilioEventSid: (0, pg_core_1.varchar)('twilio_event_sid', { length: 255 }),
    // Request Details
    requestBody: (0, pg_core_1.jsonb)('request_body').notNull(),
    requestHeaders: (0, pg_core_1.jsonb)('request_headers'),
    sourceIp: (0, pg_core_1.varchar)('source_ip', { length: 45 }),
    // Processing Status
    processingStatus: (0, pg_core_1.varchar)('processing_status', { length: 20 }).default('pending'), // pending, processed, failed
    processingError: (0, pg_core_1.text)('processing_error'),
    processingDuration: (0, pg_core_1.integer)('processing_duration'), // milliseconds
    // Associated Records
    messageId: (0, pg_core_1.uuid)('message_id').references(() => exports.smsMessages.id),
    sessionId: (0, pg_core_1.uuid)('session_id').references(() => exports.smsVerificationSessions.id),
    // Metadata
    receivedAt: (0, pg_core_1.timestamp)('received_at').defaultNow(),
    processedAt: (0, pg_core_1.timestamp)('processed_at'),
    createdAt: (0, pg_core_1.timestamp)('created_at').defaultNow()
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
// Twilio SMS Indexes
exports.expertPhoneNumbersPersonaIdx = (0, pg_core_1.index)('idx_expert_phone_numbers_persona').on(exports.expertPhoneNumbers.personaId);
exports.expertPhoneNumbersStatusIdx = (0, pg_core_1.index)('idx_expert_phone_numbers_status').on(exports.expertPhoneNumbers.phoneNumberStatus);
exports.expertPhoneNumbersTwilioNumberIdx = (0, pg_core_1.index)('idx_expert_phone_numbers_twilio').on(exports.expertPhoneNumbers.twilioPhoneNumber);
exports.smsVerificationSessionsPersonaIdx = (0, pg_core_1.index)('idx_sms_verification_sessions_persona').on(exports.smsVerificationSessions.personaId);
exports.smsVerificationSessionsPhoneIdx = (0, pg_core_1.index)('idx_sms_verification_sessions_phone').on(exports.smsVerificationSessions.phoneNumberId);
exports.smsVerificationSessionsStatusIdx = (0, pg_core_1.index)('idx_sms_verification_sessions_status').on(exports.smsVerificationSessions.sessionStatus);
exports.smsMessagesSessionIdx = (0, pg_core_1.index)('idx_sms_messages_session').on(exports.smsMessages.sessionId);
exports.smsMessagesPhoneIdx = (0, pg_core_1.index)('idx_sms_messages_phone').on(exports.smsMessages.phoneNumberId);
exports.smsMessagesTwilioSidIdx = (0, pg_core_1.index)('idx_sms_messages_twilio_sid').on(exports.smsMessages.twilioMessageSid);
exports.verificationCodesSessionIdx = (0, pg_core_1.index)('idx_verification_codes_session').on(exports.verificationCodes.sessionId);
exports.verificationCodesStatusIdx = (0, pg_core_1.index)('idx_verification_codes_status').on(exports.verificationCodes.codeStatus);
exports.smsWebhookEventsTypeIdx = (0, pg_core_1.index)('idx_sms_webhook_events_type').on(exports.smsWebhookEvents.webhookEventType);
//# sourceMappingURL=schema.js.map