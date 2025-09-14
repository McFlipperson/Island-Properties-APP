# Database Architecture - Island Properties Lead Generation System

## Core Entity Relationships

**Primary Data Flow:**
• Admin User → Personas → Platform Accounts → Manual Content → Lead Generation
• Proxy Assignments → Browser Sessions → Activity Logs → Lead Attribution
• Content Templates → Manual Posts → Engagement Tracking → ROI Analysis

## Database Schema Design

### Admin User Table (Single User System)

```sql
CREATE TABLE admin_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Personal Use Configuration
    max_personas INTEGER DEFAULT 5,
    monthly_budget_usd DECIMAL(8,2) DEFAULT 6.35, -- Proxy budget constraint
    
    -- Security Configuration
    master_encryption_key_id VARCHAR(255) NOT NULL, -- References external key management
    two_factor_enabled BOOLEAN DEFAULT true,
    two_factor_secret VARCHAR(255),
    
    -- Session Management
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### Personas Table (Real Estate Buyer Focused)

```sql
CREATE TABLE personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_user(id) ON DELETE CASCADE,
    
    -- Core Identity
    pen_name VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'inactive', -- active, inactive, suspended, developing
    
    -- Real Estate Buyer Persona
    buyer_persona_type VARCHAR(50) NOT NULL, -- manila_professional, expat_retiree, ofw_investor, etc.
    target_budget_range VARCHAR(20) NOT NULL, -- under_5m, 5m_to_15m, 15m_to_30m, above_30m
    decision_timeline VARCHAR(20) NOT NULL, -- immediate, planning, researching, dreaming
    
    -- Character Profile (Encrypted)
    demographics_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted JSON
    personality_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted JSON
    backstory_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted backstory
    
    -- Geographic Profile (Philippines Focus)
    primary_location VARCHAR(50) NOT NULL, -- Manila, Cebu
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    language_preferences JSONB DEFAULT '["en", "fil"]',
    cultural_background JSONB NOT NULL, -- Filipino cultural elements
    
    -- GEO Content Configuration
    geo_content_themes JSONB NOT NULL, -- AI-optimized content themes
    authority_focus_areas JSONB NOT NULL, -- Real estate expertise areas
    
    -- Manual Content Strategy
    manual_content_preferences JSONB NOT NULL, -- Manual posting preferences
    platform_priorities JSONB NOT NULL, -- Facebook first, then Instagram, etc.
    
    -- Security Configuration
    persona_encryption_key_id VARCHAR(255) NOT NULL, -- Separate key per persona
    browser_fingerprint_config JSONB NOT NULL, -- Browser isolation settings
    
    -- Lead Generation Configuration
    lead_generation_config JSONB NOT NULL, -- Lead capture and nurturing settings
    conversion_tracking_config JSONB NOT NULL, -- Attribution and ROI tracking
    
    -- Proxy Assignment
    proxy_id VARCHAR(100), -- Proxy-Cheap static IP identifier
    proxy_ip VARCHAR(45), -- IPv4/IPv6 address
    proxy_location VARCHAR(100), -- Manila, Cebu
    proxy_status VARCHAR(20) DEFAULT 'unassigned', -- assigned, active, error
    
    -- Performance Tracking
    total_manual_posts INTEGER DEFAULT 0,
    total_leads_generated INTEGER DEFAULT 0,
    total_qualified_leads INTEGER DEFAULT 0,
    current_authority_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100 GEO authority score
    monthly_roi DECIMAL(10,2) DEFAULT 0.00, -- Monthly ROI in USD
    
    -- Risk and Safety
    risk_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00-1.00 risk assessment
    last_security_review TIMESTAMP DEFAULT NOW(),
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_active TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_personas_admin_user ON personas(admin_user_id);
CREATE INDEX idx_personas_status ON personas(status);
CREATE INDEX idx_personas_buyer_type ON personas(buyer_persona_type);
CREATE INDEX idx_personas_proxy_id ON personas(proxy_id);
CREATE INDEX idx_personas_location ON personas(primary_location);
```

### Platform Accounts Table (Facebook Priority)

```sql
CREATE TABLE platform_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    platform_type VARCHAR(50) NOT NULL, -- facebook, instagram, linkedin, tiktok, twitter
    platform_priority INTEGER NOT NULL, -- 1=Facebook, 2=Instagram, 3=LinkedIn, etc.
    
    -- Account Details
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    profile_image_url TEXT,
    
    -- Authentication (Encrypted with persona-specific key)
    credentials_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted credentials
    auth_tokens_encrypted TEXT, -- OAuth tokens, encrypted
    
    -- Account Status and Health
    account_status VARCHAR(20) DEFAULT 'pending', -- pending, verified, suspended, banned
    verification_level VARCHAR(20) DEFAULT 'basic', -- basic, verified, business
    account_health_score DECIMAL(3,2) DEFAULT 1.00, -- 0.00-1.00 health score
    
    -- Engagement Metrics
    follower_count INTEGER DEFAULT 0,
    following_count INTEGER DEFAULT 0,
    avg_engagement_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Platform-Specific Settings (Philippines Market)
    platform_settings JSONB NOT NULL, -- Platform-specific configuration
    posting_preferences JSONB NOT NULL, -- Manual posting preferences
    engagement_strategy JSONB NOT NULL, -- Human engagement approach
    
    -- Lead Generation Performance
    leads_generated INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Risk Management (Manual Posting Safety)
    daily_manual_post_limit INTEGER DEFAULT 3, -- Conservative manual posting limit
    daily_posts_count INTEGER DEFAULT 0,
    last_post_at TIMESTAMP,
    warning_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- Composite indexes
CREATE INDEX idx_platform_accounts_persona_platform ON platform_accounts(persona_id, platform_type);
CREATE INDEX idx_platform_accounts_priority ON platform_accounts(platform_priority);
CREATE INDEX idx_platform_accounts_status ON platform_accounts(account_status);
```

### Proxy Management Table (Proxy-Cheap Integration)

```sql
CREATE TABLE proxy_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Proxy-Cheap Details
    proxy_cheap_id VARCHAR(100) UNIQUE NOT NULL, -- Proxy-Cheap identifier
    proxy_ip VARCHAR(45) NOT NULL,
    proxy_port INTEGER NOT NULL,
    proxy_username VARCHAR(100) NOT NULL,
    proxy_password_encrypted TEXT NOT NULL, -- AES-256 encrypted
    
    -- Geographic Details (Philippines Focus)
    country_code VARCHAR(2) DEFAULT 'PH',
    city VARCHAR(100) NOT NULL, -- Manila, Cebu
    isp_name VARCHAR(100),
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    
    -- Assignment Status
    assignment_status VARCHAR(20) DEFAULT 'available', -- available, assigned, maintenance
    assigned_persona_id UUID REFERENCES personas(id),
    assigned_at TIMESTAMP,
    
    -- Health Monitoring
    last_health_check TIMESTAMP DEFAULT NOW(),
    health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, degraded, failed
    response_time_ms INTEGER,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    
    -- Reputation Monitoring
    reputation_score DECIMAL(3,2) DEFAULT 1.00, -- 0.00-1.00 reputation score
    blacklist_status JSONB DEFAULT '{}', -- Blacklist check results
    last_reputation_check TIMESTAMP DEFAULT NOW(),
    
    -- Usage Tracking (Budget Management)
    monthly_bandwidth_gb DECIMAL(10,2) DEFAULT 0.00,
    monthly_requests INTEGER DEFAULT 0,
    monthly_cost_usd DECIMAL(8,2) DEFAULT 1.27, -- $1.27/month per IP
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Unique constraint for one proxy per persona
CREATE UNIQUE INDEX idx_proxy_assignments_persona ON proxy_assignments(assigned_persona_id) 
WHERE assigned_persona_id IS NOT NULL;

CREATE INDEX idx_proxy_assignments_city ON proxy_assignments(city);
CREATE INDEX idx_proxy_assignments_status ON proxy_assignments(assignment_status);
```

### Browser Sessions Table (Manual Posting Sessions)

```sql
CREATE TABLE persona_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    
    -- Session Details
    session_type VARCHAR(20) DEFAULT 'manual_posting', -- manual_posting, engagement, research
    session_status VARCHAR(20) DEFAULT 'starting', -- starting, active, idle, ended, error
    browser_instance_id VARCHAR(100), -- Browser context identifier
    
    -- Proxy Connection
    proxy_id UUID REFERENCES proxy_assignments(id),
    proxy_connected_at TIMESTAMP,
    proxy_disconnected_at TIMESTAMP,
    proxy_validation_passed BOOLEAN DEFAULT false, -- IP location validation
    
    -- Platform Connections
    active_platforms JSONB DEFAULT '[]', -- Currently logged in platforms
    platform_sessions JSONB DEFAULT '{}', -- Session details per platform
    
    -- Manual Activity Tracking
    manual_posts_created INTEGER DEFAULT 0,
    manual_engagements INTEGER DEFAULT 0,
    manual_responses INTEGER DEFAULT 0,
    content_reviewed INTEGER DEFAULT 0,
    
    -- Browser Isolation Validation
    fingerprint_randomization_active BOOLEAN DEFAULT false,
    isolation_validation_passed BOOLEAN DEFAULT false,
    security_checks_passed BOOLEAN DEFAULT false,
    
    -- Lead Generation Activity
    leads_identified INTEGER DEFAULT 0,
    lead_interactions INTEGER DEFAULT 0,
    
    -- Session Lifecycle
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration_minutes INTEGER,
    
    -- Security Monitoring
    suspicious_activity_detected BOOLEAN DEFAULT false,
    security_events JSONB DEFAULT '[]'
);

CREATE INDEX idx_persona_sessions_persona_id ON persona_sessions(persona_id);
CREATE INDEX idx_persona_sessions_status ON persona_sessions(session_status);
CREATE INDEX idx_persona_sessions_type ON persona_sessions(session_type);
```

### Content Templates (Manual Posting Optimization)

```sql
CREATE TABLE content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_user(id) ON DELETE CASCADE,
    
    -- Template Details
    template_name VARCHAR(100) NOT NULL,
    template_category VARCHAR(50) NOT NULL, -- educational, lifestyle, market_insight, personal_story
    content_type VARCHAR(50) NOT NULL, -- text, image, video, carousel
    
    -- GEO Optimization Focus
    geo_optimization_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    ai_citation_potential VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    authority_signals JSONB DEFAULT '[]', -- Authority-building elements
    
    -- Template Content (For Manual Customization)
    template_headline VARCHAR(255),
    template_body_framework TEXT, -- Framework for manual content creation
    call_to_action_suggestions JSONB DEFAULT '[]',
    hashtag_suggestions JSONB DEFAULT '[]',
    
    -- Real Estate Focus
    buyer_persona_targeting JSONB NOT NULL, -- Which buyer personas this targets
    funnel_stage VARCHAR(20) NOT NULL, -- awareness, consideration, decision
    lead_generation_potential VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    
    -- Media Assets
    media_urls JSONB DEFAULT '[]',
    media_metadata JSONB DEFAULT '{}', -- dimensions, file sizes, alt text
    
    -- Platform Targeting
    target_platforms JSONB NOT NULL, -- facebook, instagram, linkedin, etc.
    platform_adaptation_notes JSONB DEFAULT '{}', -- How to adapt per platform
    
    -- Manual Customization Guidance
    personalization_rules JSONB DEFAULT '{}', -- How to adapt per persona
    local_reference_suggestions JSONB DEFAULT '[]', -- Manila/Cebu references
    cultural_adaptation_notes TEXT,
    
    -- Performance Tracking
    usage_count INTEGER DEFAULT 0,
    manual_customization_rate DECIMAL(5,2) DEFAULT 100.00, -- % manually customized
    lead_generation_rate DECIMAL(5,4) DEFAULT 0.0000, -- Leads per use
    
    -- Template Quality
    effectiveness_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00-1.00 effectiveness
    user_satisfaction_rating DECIMAL(3,2) DEFAULT 0.00, -- 0.00-5.00 user rating
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_content_templates_category ON content_templates(template_category);
CREATE INDEX idx_content_templates_buyer_targeting ON content_templates USING GIN(buyer_persona_targeting);
CREATE INDEX idx_content_templates_platforms ON content_templates USING GIN(target_platforms);
```

### Manual Posts Table (Human-Created Content)

```sql
CREATE TABLE manual_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE CASCADE,
    content_template_id UUID REFERENCES content_templates(id), -- NULL if original content
    session_id UUID REFERENCES persona_sessions(id),
    
    -- Manual Creation Process
    creation_method VARCHAR(30) NOT NULL, -- template_based, original_creation, trending_response
    creation_started_at TIMESTAMP NOT NULL,
    creation_completed_at TIMESTAMP,
    creation_time_minutes INTEGER,
    human_effort_level VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    
    -- Content Details (Final Manual Version)
    final_content TEXT NOT NULL,
    final_hashtags JSONB DEFAULT '[]',
    final_media_urls JSONB DEFAULT '[]',
    platform_specific_adaptations JSONB DEFAULT '{}',
    
    -- Manual Customization Analysis
    template_modifications JSONB DEFAULT '{}', -- What was changed from template
    persona_voice_applied BOOLEAN DEFAULT true,
    local_references_included JSONB DEFAULT '[]', -- Manila/Cebu references used
    cultural_authenticity_score DECIMAL(3,2) DEFAULT 1.00,
    
    -- GEO Optimization Elements
    geo_optimization_applied BOOLEAN DEFAULT false,
    authority_signals_included JSONB DEFAULT '[]',
    ai_citation_elements JSONB DEFAULT '[]', -- Elements designed for AI citation
    question_answer_format BOOLEAN DEFAULT false,
    
    -- Manual Publishing
    published_manually_at TIMESTAMP,
    platform_post_id VARCHAR(255), -- Platform's ID for the post
    publishing_method VARCHAR(20) DEFAULT 'immediate_manual',
    
    -- Lead Generation Focus
    lead_generation_intent VARCHAR(20) NOT NULL, -- awareness, consideration, conversion
    buyer_persona_targeting VARCHAR(50) NOT NULL, -- Target buyer persona
    conversion_hooks JSONB DEFAULT '[]', -- Elements designed to generate leads
    
    -- Performance Tracking (Manual Monitoring)
    immediate_engagement JSONB DEFAULT '{}', -- First hour engagement
    daily_engagement JSONB DEFAULT '{}', -- 24-hour performance
    weekly_engagement JSONB DEFAULT '{}', -- 7-day performance
    
    -- Lead Generation Results
    leads_generated INTEGER DEFAULT 0,
    qualified_leads INTEGER DEFAULT 0,
    direct_inquiries INTEGER DEFAULT 0,
    profile_visits_attributed INTEGER DEFAULT 0,
    
    -- Quality Assessment
    content_authenticity_score DECIMAL(3,2) DEFAULT 1.00, -- Human authenticity
    engagement_quality_score DECIMAL(3,2) DEFAULT 0.00, -- Quality of engagement received
    lead_quality_score DECIMAL(3,2) DEFAULT 0.00, -- Quality of leads generated
    
    -- Manual Review and Optimization
    user_satisfaction INTEGER, -- 1-5 rating of satisfaction with post
    improvement_notes TEXT, -- Manual notes for future improvement
    would_reuse_approach BOOLEAN, -- Whether approach was effective
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_manual_posts_persona_platform ON manual_posts(persona_id, platform_account_id);
CREATE INDEX idx_manual_posts_published_at ON manual_posts(published_manually_at);
CREATE INDEX idx_manual_posts_lead_generation ON manual_posts(lead_generation_intent, buyer_persona_targeting);
CREATE INDEX idx_manual_posts_template_performance ON manual_posts(content_template_id, leads_generated);
```

### Lead Generation Tracking

```sql
CREATE TABLE lead_generation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Lead Source Attribution
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    platform_account_id UUID REFERENCES platform_accounts(id) ON DELETE CASCADE,
    manual_post_id UUID REFERENCES manual_posts(id), -- Attribution to specific post
    
    -- Lead Details
    lead_type VARCHAR(30) NOT NULL, -- dm_inquiry, comment_question, profile_visit, direct_contact
    lead_quality_score DECIMAL(3,2) DEFAULT 0.00, -- 0.00-1.00 quality assessment
    lead_stage VARCHAR(20) DEFAULT 'awareness', -- awareness, consideration, decision, conversion
    
    -- Contact Information (Encrypted)
    contact_info_encrypted TEXT, -- Encrypted contact details
    
    -- Lead Qualification Data
    buyer_persona_match VARCHAR(50), -- Which buyer persona they match
    budget_indication VARCHAR(20), -- Budget range indicated
    timeline_indication VARCHAR(20), -- Purchase timeline indicated
    property_interest_type JSONB DEFAULT '[]', -- Type of properties interested in
    location_preference VARCHAR(100), -- Geographic preference
    
    -- Interaction Details
    initial_interaction_data JSONB NOT NULL, -- Details of first interaction
    interaction_platform VARCHAR(50) NOT NULL, -- facebook, instagram, etc.
    interaction_content TEXT, -- What they said/asked
    
    -- Follow-up Tracking
    follow_up_required BOOLEAN DEFAULT true,
    follow_up_completed_at TIMESTAMP,
    follow_up_method VARCHAR(30), -- dm_response, comment_reply, external_contact
    follow_up_outcome VARCHAR(30), -- qualified, unqualified, no_response, converted
    
    -- Attribution Analysis
    first_touch_attribution BOOLEAN DEFAULT false, -- Was this the first interaction?
    last_touch_attribution BOOLEAN DEFAULT false, -- Was this the final interaction before conversion?
    attribution_value DECIMAL(10,2) DEFAULT 0.00, -- Attributed value of this interaction
    
    -- Conversion Tracking
    converted_to_inquiry BOOLEAN DEFAULT false,
    inquiry_submission_date TIMESTAMP,
    island_properties_contact_made BOOLEAN DEFAULT false,
    conversion_value_usd DECIMAL(12,2) DEFAULT 0.00,
    
    -- Lead Nurturing
    nurturing_stage VARCHAR(30) DEFAULT 'initial', -- initial, engaged, qualified, hot
    last_engagement_date TIMESTAMP,
    engagement_frequency VARCHAR(20), -- daily, weekly, monthly
    content_preferences JSONB DEFAULT '{}', -- What content they engage with most
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lead_generation_persona_id ON lead_generation_events(persona_id);
CREATE INDEX idx_lead_generation_platform ON lead_generation_events(platform_account_id);
CREATE INDEX idx_lead_generation_post_attribution ON lead_generation_events(manual_post_id);
CREATE INDEX idx_lead_generation_quality ON lead_generation_events(lead_quality_score);
CREATE INDEX idx_lead_generation_stage ON lead_generation_events(lead_stage);
CREATE INDEX idx_lead_generation_converted ON lead_generation_events(converted_to_inquiry);
```

### ROI and Performance Analytics

```sql
CREATE TABLE roi_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Analysis Period
    analysis_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Persona Performance
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    
    -- Cost Analysis
    proxy_costs_usd DECIMAL(8,2) DEFAULT 0.00,
    time_investment_hours DECIMAL(6,2) DEFAULT 0.00,
    time_cost_usd DECIMAL(10,2) DEFAULT 0.00, -- Time valued at hourly rate
    total_costs_usd DECIMAL(10,2) DEFAULT 0.00,
    
    -- Content Performance
    manual_posts_created INTEGER DEFAULT 0,
    total_engagement_received INTEGER DEFAULT 0,
    avg_engagement_rate DECIMAL(5,4) DEFAULT 0.0000,
    content_authority_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Lead Generation Performance
    total_leads_generated INTEGER DEFAULT 0,
    qualified_leads_generated INTEGER DEFAULT 0,
    lead_conversion_rate DECIMAL(5,4) DEFAULT 0.0000,
    cost_per_lead_usd DECIMAL(8,2) DEFAULT 0.00,
    cost_per_qualified_lead_usd DECIMAL(8,2) DEFAULT 0.00,
    
    -- Revenue Attribution
    attributed_inquiries INTEGER DEFAULT 0,
    attributed_revenue_usd DECIMAL(12,2) DEFAULT 0.00,
    pipeline_value_usd DECIMAL(12,2) DEFAULT 0.00,
    
    -- ROI Calculations
    revenue_roi_percentage DECIMAL(8,4) DEFAULT 0.0000,
    pipeline_roi_percentage DECIMAL(8,4) DEFAULT 0.0000,
    cumulative_roi_percentage DECIMAL(8,4) DEFAULT 0.0000,
    
    -- GEO Performance Estimates
    estimated_ai_citations INTEGER DEFAULT 0,
    organic_search_visibility_score DECIMAL(5,2) DEFAULT 0.00,
    authority_building_progress DECIMAL(3,2) DEFAULT 0.00,
    
    -- Efficiency Metrics
    posts_per_lead DECIMAL(6,2) DEFAULT 0.00,
    engagement_per_hour DECIMAL(8,2) DEFAULT 0.00,
    leads_per_hour DECIMAL(6,4) DEFAULT 0.0000,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_roi_analytics_persona_period ON roi_analytics(persona_id, analysis_period, period_start_date);
CREATE INDEX idx_roi_analytics_roi ON roi_analytics(revenue_roi_percentage);
```

### Activity Logging (Security and Audit)

```sql
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Context
    admin_user_id UUID REFERENCES admin_user(id),
    persona_id UUID REFERENCES personas(id),
    session_id UUID REFERENCES persona_sessions(id),
    
    -- Activity Details
    activity_type VARCHAR(50) NOT NULL, -- manual_login, manual_post, manual_engagement, lead_interaction
    platform_type VARCHAR(50), -- facebook, instagram, etc.
    activity_data JSONB NOT NULL, -- Detailed activity information
    
    -- Manual vs Automated Classification
    interaction_method VARCHAR(20) NOT NULL DEFAULT 'manual', -- manual, system_assisted, automated
    human_verification BOOLEAN DEFAULT true, -- Verified as human action
    
    -- Security Information
    ip_address VARCHAR(45),
    proxy_ip VARCHAR(45),
    user_agent TEXT,
    browser_fingerprint_hash VARCHAR(255),
    
    -- Geographic Validation
    expected_location VARCHAR(100), -- Manila, Cebu
    actual_location VARCHAR(100), -- From IP geolocation
    location_validation_passed BOOLEAN DEFAULT false,
    
    -- Risk Assessment
    risk_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    anomaly_score DECIMAL(5,4) DEFAULT 0.0000,
    security_flags JSONB DEFAULT '[]',
    
    -- Performance Impact
    response_time_ms INTEGER,
    success BOOLEAN DEFAULT true,
    error_details TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Partitioning by month for performance (90-day retention)
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
CREATE INDEX idx_activity_logs_persona_type ON activity_logs(persona_id, activity_type);
CREATE INDEX idx_activity_logs_risk_level ON activity_logs(risk_level);
CREATE INDEX idx_activity_logs_human_verification ON activity_logs(human_verification);
```

### Security Events (Threat Detection)

```sql
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Event Classification
    event_type VARCHAR(50) NOT NULL, -- authentication_failure, suspicious_activity, proxy_failure, rate_limit_hit
    severity VARCHAR(20) NOT NULL, -- info, warning, error, critical
    
    -- Context
    admin_user_id UUID REFERENCES admin_user(id),
    persona_id UUID REFERENCES personas(id),
    platform_account_id UUID REFERENCES platform_accounts(id),
    
    -- Event Details
    event_description TEXT NOT NULL,
    event_data JSONB NOT NULL,
    
    -- Network Information
    source_ip VARCHAR(45),
    proxy_ip VARCHAR(45),
    expected_proxy_ip VARCHAR(45),
    user_agent TEXT,
    
    -- Threat Assessment
    threat_level VARCHAR(20) DEFAULT 'low', -- low, medium, high, critical
    automated_response_taken JSONB DEFAULT '[]',
    manual_review_required BOOLEAN DEFAULT false,
    
    -- Resolution Tracking
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_threat_level ON security_events(threat_level);
CREATE INDEX idx_security_events_resolved ON security_events(resolved);
```

## Data Encryption Strategy

### Encryption Implementation

```typescript
interface EncryptionArchitecture {
  // Master Key Management
  masterKey: {
    storage: 'aws_kms' | 'local_hsm' | 'vault'; // External key management
    rotation: 'quarterly'; // Regular key rotation
    backup: 'geographically_distributed'; // Key backup strategy
  };
  
  // Persona-Specific Keys
  personaKeys: {
    derivation: 'pbkdf2_with_persona_salt'; // Unique key per persona
    algorithm: 'AES-256-GCM'; // Authenticated encryption
    keySize: 256; // bits
    ivSize: 96; // bits for GCM
  };
  
  // Encrypted Data Categories
  encryptedFields: {
    credentials: 'AES-256-GCM'; // Social media credentials
    personalData: 'AES-256-GCM'; // Demographics, backstory
    leadData: 'AES-256-GCM'; // Lead contact information
    behavioralData: 'AES-256-GCM'; // Behavioral patterns
  };
}

// Example encrypted field storage
interface EncryptedField {
  algorithm: 'AES-256-GCM';
  keyId: string; // References encryption key
  iv: string; // Base64 encoded initialization vector
  data: string; // Base64 encoded encrypted data
  authTag: string; // Base64 encoded authentication tag
}
```

## Data Retention and Compliance

### Philippines-Focused Data Retention

```sql
-- Data retention policies for personal use system
CREATE TABLE data_retention_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data_category VARCHAR(50) NOT NULL,
    retention_period_days INTEGER NOT NULL,
    deletion_method VARCHAR(30) NOT NULL, -- secure_delete, encryption_key_destruction
    compliance_requirement VARCHAR(100), -- Philippines Data Privacy Act, GDPR
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Example retention periods
INSERT INTO data_retention_policies (data_category, retention_period_days, deletion_method, compliance_requirement) VALUES
('activity_logs', 90, 'secure_delete', 'Operational efficiency'),
('security_events', 365, 'secure_delete', 'Philippines Data Privacy Act'),
('lead_generation_events', 2555, 'encryption_key_destruction', 'Business requirement'), -- 7 years
('manual_posts', 1095, 'secure_delete', 'Content lifecycle'), -- 3 years
('persona_data', -1, 'manual_deletion', 'User controlled'); -- Until user deletion
```

## Performance Optimization

### Personal Use Optimization Strategy

```sql
-- Materialized view for persona performance dashboard
CREATE MATERIALIZED VIEW persona_performance_summary AS
SELECT 
    p.id as persona_id,
    p.pen_name,
    p.buyer_persona_type,
    p.primary_location,
    
    -- Content Performance
    COUNT(mp.id) as total_manual_posts,
    AVG(mp.engagement_quality_score) as avg_engagement_quality,
    
    -- Lead Generation Performance
    SUM(mp.leads_generated) as total_leads,
    SUM(mp.qualified_leads) as total_qualified_leads,
    
    -- ROI Metrics
    COALESCE(AVG(ra.revenue_roi_percentage), 0) as avg_roi_percentage,
    COALESCE(AVG(ra.cost_per_qualified_lead_usd), 0) as avg_cost_per_lead,
    
    -- Security Health
    p.risk_score,
    pa.health_status as proxy_health,
    
    -- Last Activity
    p.last_active,
    MAX(mp.published_manually_at) as last_post_date
    
FROM personas p
LEFT JOIN manual_posts mp ON p.id = mp.persona_id
LEFT JOIN roi_analytics ra ON p.id = ra.persona_id
LEFT JOIN proxy_assignments pa ON p.proxy_id = pa.proxy_cheap_id
WHERE p.status = 'active'
GROUP BY p.id, p.pen_name, p.buyer_persona_type, p.primary_location, p.risk_score, pa.health_status, p.last_active;

-- Refresh schedule for materialized view
CREATE OR REPLACE FUNCTION refresh_persona_performance() RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW persona_performance_summary;
END;
$$ LANGUAGE plpgsql;

-- Schedule refresh every hour
SELECT cron.schedule('refresh-persona-performance', '0 * * * *', 'SELECT refresh_persona_performance();');
```

### Query Optimization for Real-Time Dashboard

```sql
-- Optimized query for real-time persona switching
CREATE OR REPLACE FUNCTION get_persona_quick_switch_data(persona_uuid UUID)
RETURNS TABLE (
    persona_info JSONB,
    proxy_info JSONB,
    platform_accounts JSONB,
    recent_activity JSONB,
    security_status JSONB
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        -- Persona core info
        jsonb_build_object(
            'id', p.id,
            'pen_name', p.pen_name,
            'buyer_persona_type', p.buyer_persona_type,
            'primary_location', p.primary_location,
            'status', p.status,
            'last_active', p.last_active
        ) as persona_info,
        
        -- Proxy connection info
        jsonb_build_object(
            'proxy_ip', pa.proxy_ip,
            'proxy_port', pa.proxy_port,
            'city', pa.city,
            'health_status', pa.health_status,
            'reputation_score', pa.reputation_score
        ) as proxy_info,
        
        -- Platform accounts
        (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'platform_type', pac.platform_type,
                    'platform_priority', pac.platform_priority,
                    'username', pac.username,
                    'account_status', pac.account_status,
                    'account_health_score', pac.account_health_score
                ) ORDER BY pac.platform_priority
            )
            FROM platform_accounts pac 
            WHERE pac.persona_id = p.id AND pac.is_active = true
        ) as platform_accounts,
        
        -- Recent activity summary
        jsonb_build_object(
            'last_manual_post', (
                SELECT mp.published_manually_at 
                FROM manual_posts mp 
                WHERE mp.persona_id = p.id 
                ORDER BY mp.published_manually_at DESC 
                LIMIT 1
            ),
            'posts_last_7_days', (
                SELECT COUNT(*) 
                FROM manual_posts mp 
                WHERE mp.persona_id = p.id 
                AND mp.published_manually_at > NOW() - INTERVAL '7 days'
            ),
            'leads_last_30_days', (
                SELECT COUNT(*) 
                FROM lead_generation_events lge 
                WHERE lge.persona_id = p.id 
                AND lge.created_at > NOW() - INTERVAL '30 days'
            )
        ) as recent_activity,
        
        -- Security status
        jsonb_build_object(
            'risk_score', p.risk_score,
            'last_security_review', p.last_security_review,
            'proxy_validation_passed', COALESCE(
                (SELECT ps.proxy_validation_passed 
                FROM persona_sessions ps 
                WHERE ps.persona_id = p.id 
                ORDER BY ps.started_at DESC 
                LIMIT 1), false
            ),
            'recent_security_events', (
                SELECT COUNT(*) 
                FROM security_events se 
                WHERE se.persona_id = p.id 
                AND se.created_at > NOW() - INTERVAL '24 hours'
                AND se.severity IN ('error', 'critical')
            )
        ) as security_status
        
    FROM personas p
    LEFT JOIN proxy_assignments pa ON p.proxy_id = pa.proxy_cheap_id
    WHERE p.id = persona_uuid;
END;
$ LANGUAGE plpgsql;
```

## Database Migration Strategy

### Version Control and Deployment

```sql
-- Schema version tracking
CREATE TABLE schema_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    migration_sql TEXT NOT NULL,
    rollback_sql TEXT,
    applied_at TIMESTAMP DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT 'system'
);

-- Initial schema version
INSERT INTO schema_migrations (version, description, migration_sql) VALUES
('1.0.0', 'Initial Island Properties lead generation schema', 'Initial schema creation');
```

### Backup and Recovery Strategy

```sql
-- Automated backup configuration
CREATE TABLE backup_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(30) NOT NULL, -- full, incremental, encrypted_only
    schedule_cron VARCHAR(50) NOT NULL,
    retention_days INTEGER NOT NULL,
    encryption_required BOOLEAN DEFAULT true,
    backup_location VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Example backup configurations for personal use
INSERT INTO backup_configurations (backup_type, schedule_cron, retention_days, backup_location) VALUES
('full', '0 2 * * 0', 30, 'local_encrypted'), -- Weekly full backup, 30-day retention
('incremental', '0 3 * * 1-6', 7, 'local_encrypted'), -- Daily incremental, 7-day retention
('encrypted_only', '0 1 * * *', 90, 'cloud_encrypted'); -- Daily encrypted data backup, 90-day retention
```

## Development Environment Configuration

### Local Development Setup

```sql
-- Development-specific configurations
CREATE TABLE development_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_type VARCHAR(30) NOT NULL, -- database, proxy, security, testing
    environment VARCHAR(20) NOT NULL, -- development, staging, production
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Development environment settings
INSERT INTO development_configurations (config_key, config_value, config_type, environment) VALUES
('max_personas_dev', '2', 'database', 'development'), -- Limit personas in dev
('proxy_simulation_mode', 'true', 'proxy', 'development'), -- Simulate proxy connections
('encryption_key_dev', 'dev_key_placeholder', 'security', 'development'), -- Dev encryption key
('rate_limit_bypass', 'true', 'testing', 'development'), -- Bypass rate limits in dev
('lead_generation_simulation', 'true', 'testing', 'development'); -- Simulate lead generation
```

## Cost Monitoring and Budget Management

### Budget Tracking Tables

```sql
-- Monthly budget tracking
CREATE TABLE monthly_budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year VARCHAR(7) NOT NULL, -- 'YYYY-MM' format
    
    -- Budget Allocations
    total_budget_usd DECIMAL(8,2) DEFAULT 6.35, -- $6.35/month constraint
    proxy_budget_usd DECIMAL(8,2) DEFAULT 6.35, -- All budget allocated to proxies
    buffer_budget_usd DECIMAL(8,2) DEFAULT 0.00, -- Emergency buffer
    
    -- Actual Spending
    proxy_costs_actual DECIMAL(8,2) DEFAULT 0.00,
    additional_costs_actual DECIMAL(8,2) DEFAULT 0.00,
    total_spent_usd DECIMAL(8,2) DEFAULT 0.00,
    
    -- Budget Performance
    budget_utilization_percentage DECIMAL(5,2) DEFAULT 0.00,
    cost_per_persona DECIMAL(6,3) DEFAULT 0.00,
    cost_per_lead DECIMAL(8,2) DEFAULT 0.00,
    
    -- ROI Analysis
    revenue_generated_usd DECIMAL(12,2) DEFAULT 0.00,
    roi_percentage DECIMAL(8,4) DEFAULT 0.0000,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Daily cost tracking
CREATE TABLE daily_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cost_date DATE NOT NULL,
    persona_id UUID REFERENCES personas(id) ON DELETE CASCADE,
    
    -- Daily Cost Breakdown
    proxy_cost_usd DECIMAL(6,4) DEFAULT 0.0000, -- Daily proxy cost (~$0.04/day per IP)
    bandwidth_overage_usd DECIMAL(6,4) DEFAULT 0.0000,
    additional_service_costs_usd DECIMAL(6,4) DEFAULT 0.0000,
    total_daily_cost_usd DECIMAL(6,4) DEFAULT 0.0000,
    
    -- Daily Performance
    manual_posts_created INTEGER DEFAULT 0,
    engagement_received INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    
    -- Daily Efficiency Metrics
    cost_per_post_usd DECIMAL(6,4) DEFAULT 0.0000,
    cost_per_engagement_usd DECIMAL(6,6) DEFAULT 0.000000,
    cost_per_lead_usd DECIMAL(8,4) DEFAULT 0.0000,
    
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_daily_costs_date_persona ON daily_costs(cost_date, persona_id);
CREATE INDEX idx_monthly_budgets_month ON monthly_budgets(month_year);
```

## Error Handling and Monitoring

### System Health Monitoring

```sql
-- System health metrics
CREATE TABLE system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Database Performance
    active_connections INTEGER DEFAULT 0,
    query_response_time_ms INTEGER DEFAULT 0,
    database_size_mb BIGINT DEFAULT 0,
    
    -- Proxy Health Summary
    total_proxies INTEGER DEFAULT 0,
    healthy_proxies INTEGER DEFAULT 0,
    degraded_proxies INTEGER DEFAULT 0,
    failed_proxies INTEGER DEFAULT 0,
    
    -- Persona Activity
    active_personas INTEGER DEFAULT 0,
    active_sessions INTEGER DEFAULT 0,
    manual_posts_last_24h INTEGER DEFAULT 0,
    
    -- Lead Generation Performance
    leads_generated_last_24h INTEGER DEFAULT 0,
    conversion_rate_last_24h DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Security Status
    security_events_last_24h INTEGER DEFAULT 0,
    high_risk_events_last_24h INTEGER DEFAULT 0,
    failed_authentications_last_24h INTEGER DEFAULT 0,
    
    -- Budget Status
    monthly_budget_utilization DECIMAL(5,2) DEFAULT 0.00,
    daily_cost_trend DECIMAL(6,4) DEFAULT 0.0000,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Automated health check function
CREATE OR REPLACE FUNCTION record_system_health() RETURNS void AS $
DECLARE
    health_record system_health_metrics%ROWTYPE;
BEGIN
    -- Collect current system metrics
    SELECT 
        pg_stat_get_numbackends(),
        EXTRACT(EPOCH FROM (SELECT avg(query_time) FROM pg_stat_statements WHERE calls > 0)) * 1000,
        pg_database_size(current_database()) / 1024 / 1024,
        
        COUNT(*) FILTER (WHERE assignment_status = 'assigned'),
        COUNT(*) FILTER (WHERE health_status = 'healthy'),
        COUNT(*) FILTER (WHERE health_status = 'degraded'),
        COUNT(*) FILTER (WHERE health_status = 'failed'),
        
        (SELECT COUNT(*) FROM personas WHERE status = 'active'),
        (SELECT COUNT(*) FROM persona_sessions WHERE session_status = 'active'),
        (SELECT COUNT(*) FROM manual_posts WHERE published_manually_at > NOW() - INTERVAL '24 hours'),
        
        (SELECT COUNT(*) FROM lead_generation_events WHERE created_at > NOW() - INTERVAL '24 hours'),
        (SELECT AVG(lead_quality_score) FROM lead_generation_events WHERE created_at > NOW() - INTERVAL '24 hours'),
        
        (SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(*) FROM security_events WHERE created_at > NOW() - INTERVAL '24 hours' AND severity IN ('error', 'critical')),
        (SELECT COUNT(*) FROM activity_logs WHERE created_at > NOW() - INTERVAL '24 hours' AND activity_type = 'authentication_failure')
        
    INTO health_record.active_connections, health_record.query_response_time_ms, health_record.database_size_mb,
         health_record.total_proxies, health_record.healthy_proxies, health_record.degraded_proxies, health_record.failed_proxies,
         health_record.active_personas, health_record.active_sessions, health_record.manual_posts_last_24h,
         health_record.leads_generated_last_24h, health_record.conversion_rate_last_24h,
         health_record.security_events_last_24h, health_record.high_risk_events_last_24h, health_record.failed_authentications_last_24h
    FROM proxy_assignments;
    
    -- Insert health record
    INSERT INTO system_health_metrics (
        active_connections, query_response_time_ms, database_size_mb,
        total_proxies, healthy_proxies, degraded_proxies, failed_proxies,
        active_personas, active_sessions, manual_posts_last_24h,
        leads_generated_last_24h, conversion_rate_last_24h,
        security_events_last_24h, high_risk_events_last_24h, failed_authentications_last_24h
    ) VALUES (
        health_record.active_connections, health_record.query_response_time_ms, health_record.database_size_mb,
        health_record.total_proxies, health_record.healthy_proxies, health_record.degraded_proxies, health_record.failed_proxies,
        health_record.active_personas, health_record.active_sessions, health_record.manual_posts_last_24h,
        health_record.leads_generated_last_24h, health_record.conversion_rate_last_24h,
        health_record.security_events_last_24h, health_record.high_risk_events_last_24h, health_record.failed_authentications_last_24h
    );
END;
$ LANGUAGE plpgsql;

-- Schedule health checks every 15 minutes
SELECT cron.schedule('system-health-check', '*/15 * * * *', 'SELECT record_system_health();');
```

This comprehensive database architecture provides the foundation for Island Properties' lead generation system with:

- **Real estate buyer persona focus** with 7 distinct buyer types
- **Manual posting workflow optimization** with human-controlled content creation
- **GEO content optimization** for AI engine citation and authority building
- **Lead generation tracking** from social media to Island Properties conversions
- **Security-first design** with persona-specific encryption and browser isolation
- **Cost management** within the $6.35/month proxy budget constraint
- **Philippines market focus** with Manila/Cebu geographic targeting
- **Performance monitoring** for ROI and lead generation effectiveness

The schema is optimized for personal use while maintaining enterprise-level security and tracking capabilities for serious lead generation operations.