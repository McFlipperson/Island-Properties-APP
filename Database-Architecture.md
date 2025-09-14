Data Model - Persona App Database Architecture Core Entity Relationships
Primary Entities

• Users → Personas → Platform Accounts → Content • Proxy Assignments →
Sessions → Activity Logs • Content Templates → Scheduled Posts →
Engagement Metrics Database Schema Design Users Table

CREATE TABLE users ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255) NOT NULL,
subscription_tier VARCHAR(50) DEFAULT 'basic', -- basic, pro, enterprise
max_personas INTEGER DEFAULT 5, created_at TIMESTAMP DEFAULT NOW(),
updated_at TIMESTAMP DEFAULT NOW(), last_login TIMESTAMP, is_active
BOOLEAN DEFAULT true, two_factor_enabled BOOLEAN DEFAULT false,
two_factor_secret VARCHAR(255) ); Personas Table

CREATE TABLE personas ( id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
user_id UUID REFERENCES users(id) ON DELETE CASCADE, name VARCHAR(100)
NOT NULL, status VARCHAR(20) DEFAULT 'inactive', -- active, inactive,
suspended

     -- Core Identity

demographics JSONB NOT NULL, -- age, gender, location, occupation
personality JSONB NOT NULL, -- interests, values, communication_style
backstory TEXT,

-- Geographic Profile primary_location VARCHAR(100) NOT NULL, -- Manila,
Cebu, etc. timezone VARCHAR(50) NOT NULL, language_preferences JSONB
DEFAULT '\["en", "fil"\]',

-- Behavioral Patterns activity_schedule JSONB NOT NULL, -- daily
posting times, frequency content_themes JSONB NOT NULL, -- topics,
hashtags, style preferences engagement_style JSONB NOT NULL, -- comment
frequency, interaction patterns

-- Proxy Assignment proxy_id VARCHAR(100), -- Proxy-Cheap static IP
identifier proxy_ip VARCHAR(45), -- IPv4/IPv6 address proxy_location
VARCHAR(100), -- Manila, Cebu proxy_status VARCHAR(20) DEFAULT
'unassigned', -- assigned, active, error

     -- Metadata
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     last_active TIMESTAMP,
     total_posts INTEGER DEFAULT 0,
     risk_score DECIMAL(3,2) DEFAULT 0.00 -- 0.00-1.00

);

-- Indexes for performance CREATE INDEX idx_personas_user_id ON
personas(user_id); CREATE INDEX idx_personas_status ON personas(status);
CREATE INDEX idx_personas_proxy_id ON personas(proxy_id); Platform
Accounts Table

CREATE TABLE platform_accounts ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), persona_id UUID REFERENCES personas(id) ON DELETE
CASCADE, platform_type VARCHAR(50) NOT NULL, -- twitter, instagram,
tiktok, linkedin

-- Account Details username VARCHAR(100) NOT NULL, display_name
VARCHAR(100), bio TEXT, profile_image_url TEXT,

-- Authentication (Encrypted) credentials_encrypted TEXT NOT NULL, --
AES-256 encrypted credentials auth_tokens_encrypted TEXT, -- OAuth
tokens, encrypted

-- Account Status account_status VARCHAR(20) DEFAULT 'pending', --
pending, verified, suspended, banned verification_level VARCHAR(20)
DEFAULT 'basic', -- basic, verified, business follower_count INTEGER
DEFAULT 0, following_count INTEGER DEFAULT 0,

-- Platform-Specific Settings platform_settings JSONB NOT NULL, --
posting limits, hashtag preferences posting_schedule JSONB NOT NULL, --
platform-specific timing

-- Risk Management daily_post_limit INTEGER DEFAULT 10,
daily_posts_count INTEGER DEFAULT 0, last_post_at TIMESTAMP,
cooldown_until TIMESTAMP, warning_count INTEGER DEFAULT 0,  -- Metadata
created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW(),
last_login TIMESTAMP, is_active BOOLEAN DEFAULT true );

-- Composite indexes CREATE INDEX idx_platform_accounts_persona_platform
ON platform_accounts(persona_id, platform_type); CREATE INDEX
idx_platform_accounts_status ON platform_accounts(account_status); Proxy
Management Table

CREATE TABLE proxy_assignments ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(),

-- Proxy Details (Proxy-Cheap) proxy_id VARCHAR(100) UNIQUE NOT NULL, --
Proxy-Cheap identifier proxy_ip VARCHAR(45) NOT NULL, proxy_port INTEGER
NOT NULL, proxy_username VARCHAR(100) NOT NULL, proxy_password_encrypted
TEXT NOT NULL, -- AES-256 encrypted

     -- Geographic Details
     country_code VARCHAR(2) DEFAULT 'PH',
     city VARCHAR(100) NOT NULL, -- Manila, Cebu
     isp_name VARCHAR(100),

-- Assignment Status assignment_status VARCHAR(20) DEFAULT 'available',
-- available, assigned, maintenance assigned_persona_id UUID REFERENCES
personas(id), assigned_at TIMESTAMP,

     -- Health Monitoring
     last_health_check TIMESTAMP DEFAULT NOW(),

health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, degraded,
failed response_time_ms INTEGER, uptime_percentage DECIMAL(5,2) DEFAULT
100.00,

-- Usage Tracking monthly_bandwidth_gb DECIMAL(10,2) DEFAULT 0.00,
monthly_requests INTEGER DEFAULT 0, monthly_cost_usd DECIMAL(8,2)
DEFAULT 1.27, -- \$1.27/ month per IP

     -- Metadata
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()

);

-- Unique constraint for one proxy per persona CREATE UNIQUE INDEX
idx_proxy_assignments_persona ON proxy_assignments(assigned_persona_id)
WHERE assigned_persona_id IS NOT NULL; Sessions Table

CREATE TABLE persona_sessions ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), persona_id UUID REFERENCES personas(id) ON DELETE
CASCADE,

-- Session Details session_status VARCHAR(20) DEFAULT 'starting', --
starting, active, idle, ended, error browser_instance_id VARCHAR(100),
-- Puppeteer/Playwright instance ID

     -- Proxy Connection
     proxy_id UUID REFERENCES proxy_assignments(id),
     proxy_connected_at TIMESTAMP,
     proxy_disconnected_at TIMESTAMP,

     -- Platform Connections

active_platforms JSONB DEFAULT '\[\]', -- Currently logged in platforms
platform_sessions JSONB DEFAULT '{}', -- Session details per platform

     -- Activity Tracking
     actions_performed INTEGER DEFAULT 0,
     content_posted INTEGER DEFAULT 0,
     errors_encountered INTEGER DEFAULT 0,

     -- Session Lifecycle
     started_at TIMESTAMP DEFAULT NOW(),
     ended_at TIMESTAMP,
     duration_minutes INTEGER,

     -- Risk Monitoring
     suspicious_activity_detected BOOLEAN DEFAULT false,
     risk_events JSONB DEFAULT '[]'

);

CREATE INDEX idx_persona_sessions_persona_id ON
persona_sessions(persona_id); CREATE INDEX idx_persona_sessions_status
ON persona_sessions(session_status); Content Management

CREATE TABLE content_templates ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), user_id UUID REFERENCES users(id) ON DELETE CASCADE,

-- Template Details template_name VARCHAR(100) NOT NULL, content_type
VARCHAR(50) NOT NULL, -- text, image, video, carousel template_text
TEXT,

-- Media Assets media_urls JSONB DEFAULT '\[\]', media_metadata JSONB
DEFAULT '{}', -- dimensions, file sizes, alt text  -- Targeting
target_platforms JSONB NOT NULL, -- which platforms this works for
target_personas JSONB DEFAULT '\[\]', -- which personas can use this

-- Customization Rules personalization_rules JSONB DEFAULT '{}', -- how
to adapt per persona hashtag_strategy JSONB DEFAULT '{}', -- hashtag
rules per platform timing_rules JSONB DEFAULT '{}', -- optimal posting
times

     -- Performance
     usage_count INTEGER DEFAULT 0,
     success_rate DECIMAL(5,2) DEFAULT 0.00,

     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW(),
     is_active BOOLEAN DEFAULT true

); Manual Content Work ow

CREATE TABLE manual_posts ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(), persona_id UUID REFERENCES personas(id) ON DELETE
CASCADE, platform_account_id UUID REFERENCES platform_accounts(id) ON
DELETE CASCADE, content_template_id UUID REFERENCES
content_templates(id), session_id UUID REFERENCES persona_sessions(id),

     -- Manual Creation Process
     creation_started_at TIMESTAMP NOT NULL,
     creation_completed_at TIMESTAMP,
     creation_time_minutes INTEGER,

     -- Content Details (Final Manual Version)
           fl

final_content TEXT NOT NULL, final_hashtags JSONB DEFAULT '\[\]',
final_media_urls JSONB DEFAULT '\[\]', content_edits_from_template JSONB
DEFAULT '{}', -- what was changed manually

-- Manual Publishing published_manually_at TIMESTAMP, platform_post_id
VARCHAR(255), -- Platform's ID for the post publishing_method
VARCHAR(20) DEFAULT 'manual', -- manual, scheduled_manual

-- Manual Performance Tracking immediate_engagement JSONB DEFAULT '{}',
-- likes/ comments within first hour daily_engagement JSONB DEFAULT
'{}', -- performance after 24 hours weekly_engagement JSONB DEFAULT
'{}', -- performance after 7 days

-- Quality Assessment authenticity_rating DECIMAL(3,2) DEFAULT 1.00, --
higher for manual posts user_satisfaction INTEGER, -- 1-5 rating of how
satisfied with post improvement_notes TEXT, -- manual notes for future
improvement

-- Template Performance template_effectiveness DECIMAL(5,2), -- how well
template worked manual_customization_level VARCHAR(20) DEFAULT 'high',
-- low, medium, high

     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()

); CREATE INDEX idx_manual_posts_persona_platform ON
manual_posts(persona_id, platform_account_id); CREATE INDEX
idx_manual_posts_published_at ON manual_posts(published_manually_at);
CREATE INDEX idx_manual_posts_session ON manual_posts(session_id);
CREATE INDEX idx_manual_posts_template_performance ON
manual_posts(content_template_id, template_effectiveness); Activity
Logging

CREATE TABLE activity_logs ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(),

-- Context user_id UUID REFERENCES users(id), persona_id UUID REFERENCES
personas(id), session_id UUID REFERENCES persona_sessions(id),

-- Activity Details activity_type VARCHAR(50) NOT NULL, -- login, post,
comment, like, follow, etc. platform_type VARCHAR(50), -- twitter,
instagram, etc. activity_data JSONB NOT NULL, -- detailed activity
information

-- IP and Location ip_address VARCHAR(45), user_agent TEXT,
location_data JSONB, -- city, country from IP

-- Risk Assessment risk_level VARCHAR(20) DEFAULT 'low', -- low, medium,
high, critical anomaly_score DECIMAL(5,4) DEFAULT 0.0000,

-- Compliance gdpr_category VARCHAR(50), -- performance, functional,
targeting retention_until DATE, -- when to delete this log  created_at
TIMESTAMP DEFAULT NOW() );

-- Partitioning by month for performance CREATE INDEX
idx_activity_logs_created_at ON activity_logs(created_at); CREATE INDEX
idx_activity_logs_persona_type ON activity_logs(persona_id,
activity_type); Security & Audit

CREATE TABLE security_events ( id UUID PRIMARY KEY DEFAULT
gen_random_uuid(),

-- Event Classification event_type VARCHAR(50) NOT NULL, --
login_failure, suspicious_activity, rate_limit_hit severity VARCHAR(20)
NOT NULL, -- info, warning, error, critical

-- Context user_id UUID REFERENCES users(id), persona_id UUID REFERENCES
personas(id), platform_account_id UUID REFERENCES platform_accounts(id),

     -- Event Details
     event_description TEXT NOT NULL,
     event_data JSONB NOT NULL,

     -- Network Information
     source_ip VARCHAR(45),
     proxy_ip VARCHAR(45),
     user_agent TEXT,

-- Response Actions actions_taken JSONB DEFAULT '\[\]', --
account_locked, persona_suspended, etc. resolved BOOLEAN DEFAULT false,
resolved_at TIMESTAMP, resolved_by UUID REFERENCES users(id), 
created_at TIMESTAMP DEFAULT NOW() );

CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_created_at ON
security_events(created_at); Data Encryption Strategy Sensitive Data
Fields

• Credentials: AES-256-GCM encryption • OAuth Tokens: AES-256-GCM
encryption • Proxy Passwords: AES-256-GCM encryption • Personal
Information: Field-level encryption for PII Encryption Implementation

interface EncryptedField { algorithm: 'AES-256-GCM'; iv: string; //
Initialization vector data: string; // Encrypted data tag: string; //
Authentication tag }

// Example encrypted credential storage const encryptedCredentials:
EncryptedField = { algorithm: 'AES-256-GCM', iv: 'base64-encoded-iv',
data: 'base64-encoded-encrypted-data', tag: 'base64-encoded-auth-tag' };
Data Retention Policies Retention Periods

• Activity Logs: 90 days (rolling deletion) • Security Events: 1 year
(compliance requirement)  • Session Data: 30 days (performance analysis)
• Content Templates: Until user deletion • Persona Data: Until user
deletion GDPR Compliance

      •    Right to Access: API endpoints for data export
      •    Right to Deletion: Cascade delete on user removal
      •    Right to Portability: JSON export functionality
      •    Data Minimization: Store only necessary elds
     Performance Optimizations
     Personal App Performance

      •    Single user optimization: No multi-tenant complexity
      •    Simpli ed queries: Direct persona access without user ltering
      •    Focused indexing: Performance for 5 personas maximum
      •    Local caching: Redis for active persona sessions only
     Development Simpli cation

      •    No user management: Single admin authentication
      •    Direct database access: No complex permission layers
      •    Streamlined APIs: Personal use endpoints only
      •    Simple deployment: Single-user application architecture
     Data Migration Strategy
     Version Control

      •    Drizzle ORM: Schema migrations with rollback capability
      •    Semantic Versioning: Database schema version tracking
      •    Backup Strategy: Full backup before major migrations
      •    Testing: Migration testing on staging environment
     Deployment Process

      1.   Backup Production: Full database backup
      2.   Run Migration: Execute Drizzle migration scripts
      3.   Validate Schema: Verify data integrity
      4.   Application Deployment: Deploy compatible application version
      5.   Monitor Performance: Track query performance post-migration

fi

             fi




                              fi




                                           fi


