# GEO-Optimized Database Architecture - Island Properties Lead Generation System

## Core Entity Relationships (GEO-Focused)

**Primary Data Flow:**
• Admin User → Expert Personas → GEO Platform Accounts → Authority Content → AI Citations → Lead Generation
• Content Authority → AI Engine Discovery → User Inquiries → Lead Attribution → Island Properties Conversions
• Expert Positioning → Thought Leadership → Trust Building → Consultation Requests → Revenue Generation

## Database Schema Design (GEO Strategy)

### Admin User Table (Single Expert User System)

```sql
CREATE TABLE admin_user (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- GEO Strategy Configuration
    max_expert_personas INTEGER DEFAULT 5,
    monthly_budget_usd DECIMAL(8,2) DEFAULT 6.35, -- Proxy budget constraint
    geo_optimization_level VARCHAR(20) DEFAULT 'high', -- GEO focus intensity
    authority_building_goals JSONB DEFAULT '{}', -- Expert positioning objectives
    
    -- Content Creation Preferences
    content_expertise_areas JSONB DEFAULT '[]', -- Philippines real estate specializations
    target_ai_engines JSONB DEFAULT '["chatgpt", "claude", "bard", "perplexity"]',
    citation_tracking_enabled BOOLEAN DEFAULT true,
    
    -- Security Configuration
    master_encryption_key_id VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN DEFAULT true,
    two_factor_secret VARCHAR(255),
    
    -- Session Management
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### Expert Personas Table (Authority-Focused Real Estate Experts)

```sql
CREATE TABLE expert_personas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_user(id) ON DELETE CASCADE,
    
    -- Core Expert Identity
    expert_name VARCHAR(100) NOT NULL, -- Professional expert name
    expert_status VARCHAR(20) DEFAULT 'developing', -- developing, active, established, authority
    
    -- Real Estate Expertise Specialization
    expertise_focus VARCHAR(50) NOT NULL, -- philippines_market_analysis, expat_property_guidance, investment_advisory, etc.
    target_buyer_segments JSONB NOT NULL, -- expat_retirees, ofw_investors, manila_professionals, etc.
    authority_level VARCHAR(20) DEFAULT 'emerging', -- emerging, established, recognized, thought_leader
    
    -- Expert Profile (Encrypted)
    professional_background_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted career history
    expertise_credentials_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted qualifications
    market_experience_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted market knowledge
    
    -- Geographic Expertise (Philippines Focus)
    primary_market_location VARCHAR(50) NOT NULL, -- Manila, Cebu, Davao
    secondary_market_areas JSONB DEFAULT '[]', -- Additional areas of expertise
    local_market_knowledge_depth INTEGER DEFAULT 1, -- 1-10 scale of local expertise
    timezone VARCHAR(50) DEFAULT 'Asia/Manila',
    
    -- GEO Content Authority Configuration
    geo_content_specializations JSONB NOT NULL, -- AI-optimized content areas
    authority_building_topics JSONB NOT NULL, -- Key topics for thought leadership
    citation_worthy_expertise JSONB NOT NULL, -- Areas AI engines should reference
    
    -- Platform Authority Strategy
    platform_expertise_focus JSONB NOT NULL, -- Medium articles, Reddit expertise, Quora answers
    content_publication_schedule JSONB NOT NULL, -- Publishing frequency and timing
    expert_voice_characteristics JSONB NOT NULL, -- Professional tone and approach
    
    -- Security Configuration
    persona_encryption_key_id VARCHAR(255) NOT NULL, -- Separate key per expert persona
    browser_fingerprint_config JSONB NOT NULL, -- Browser isolation settings
    
    -- Authority Building Performance
    current_authority_score DECIMAL(5,2) DEFAULT 0.00, -- 0-100 expert authority score
    estimated_ai_citations INTEGER DEFAULT 0, -- Estimated monthly AI citations
    expert_recognition_signals INTEGER DEFAULT 0, -- Upvotes, shares, expert badges
    thought_leadership_reach INTEGER DEFAULT 0, -- Monthly content reach
    
    -- Lead Generation Through Expertise
    monthly_expert_inquiries INTEGER DEFAULT 0, -- Inquiries from expert positioning
    consultation_requests INTEGER DEFAULT 0, -- Direct consultation requests
    authority_to_lead_conversion DECIMAL(5,4) DEFAULT 0.0000, -- Authority → lead rate
    
    -- Proxy Assignment (GEO Platforms)
    proxy_id VARCHAR(100), -- Proxy-Cheap static IP identifier
    proxy_ip VARCHAR(45), -- IPv4/IPv6 address
    proxy_location VARCHAR(100), -- Manila, Cebu for authentic presence
    proxy_status VARCHAR(20) DEFAULT 'unassigned',
    
    -- Performance Tracking
    total_authority_content_pieces INTEGER DEFAULT 0, -- Articles, answers, posts created
    total_qualified_leads_generated INTEGER DEFAULT 0,
    monthly_roi DECIMAL(10,2) DEFAULT 0.00, -- Monthly ROI from expert positioning
    
    -- Risk and Compliance
    expert_credibility_score DECIMAL(3,2) DEFAULT 1.00, -- Credibility assessment
    content_quality_score DECIMAL(3,2) DEFAULT 0.00, -- Average content quality
    platform_compliance_status JSONB DEFAULT '{}', -- Compliance across platforms
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_content_creation TIMESTAMP,
    authority_review_date TIMESTAMP DEFAULT NOW()
);

-- Indexes for GEO performance
CREATE INDEX idx_expert_personas_authority_level ON expert_personas(authority_level);
CREATE INDEX idx_expert_personas_expertise_focus ON expert_personas(expertise_focus);
CREATE INDEX idx_expert_personas_authority_score ON expert_personas(current_authority_score);
CREATE INDEX idx_expert_personas_location ON expert_personas(primary_market_location);
```

### GEO Platform Accounts Table (Authority Platform Priority)

```sql
CREATE TABLE geo_platform_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES expert_personas(id) ON DELETE CASCADE,
    platform_type VARCHAR(50) NOT NULL, -- medium, reddit, quora, facebook, linkedin
    platform_priority INTEGER NOT NULL, -- 1=Medium, 2=Reddit, 3=Quora, etc.
    geo_optimization_level VARCHAR(20) DEFAULT 'high', -- GEO focus for this platform
    
    -- Account Details
    username VARCHAR(100) NOT NULL,
    display_name VARCHAR(100),
    expert_bio TEXT, -- Professional bio emphasizing expertise
    expert_credentials TEXT, -- Displayed qualifications and experience
    profile_optimization_score DECIMAL(3,2) DEFAULT 0.00, -- Profile optimization for authority
    
    -- Authentication (Encrypted with persona-specific key)
    credentials_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted credentials
    auth_tokens_encrypted TEXT, -- OAuth tokens, encrypted
    
    -- Account Authority Status
    account_status VARCHAR(20) DEFAULT 'building', -- building, active, established, expert_recognized
    platform_authority_level VARCHAR(20) DEFAULT 'newcomer', -- newcomer, contributor, expert, thought_leader
    expert_verification_status VARCHAR(20) DEFAULT 'unverified', -- unverified, verified, expert_badge
    account_reputation_score DECIMAL(5,2) DEFAULT 0.00, -- Platform-specific reputation
    
    -- Content Authority Metrics
    total_authority_content INTEGER DEFAULT 0, -- Articles, answers, expert posts
    average_content_engagement DECIMAL(5,2) DEFAULT 0.00, -- Quality engagement metrics
    expert_recognition_signals INTEGER DEFAULT 0, -- Upvotes, shares, expert mentions
    thought_leadership_indicators INTEGER DEFAULT 0, -- Citations, references, expert status
    
    -- Platform-Specific GEO Configuration
    platform_geo_settings JSONB NOT NULL, -- GEO optimization settings per platform
    content_authority_strategy JSONB NOT NULL, -- Authority building approach
    expert_engagement_approach JSONB NOT NULL, -- How to engage as expert
    citation_optimization_config JSONB NOT NULL, -- AI citation optimization settings
    
    -- Authority-Based Lead Generation
    monthly_expert_inquiries INTEGER DEFAULT 0, -- Inquiries from expert status
    consultation_requests INTEGER DEFAULT 0, -- Direct consultation requests
    authority_conversion_rate DECIMAL(5,4) DEFAULT 0.0000, -- Authority → inquiry rate
    lead_quality_from_authority DECIMAL(3,2) DEFAULT 0.00, -- Quality of authority-generated leads
    
    -- Platform Content Strategy
    content_publication_frequency VARCHAR(20) DEFAULT 'weekly', -- Publishing schedule
    authority_content_types JSONB DEFAULT '[]', -- Types of content for authority building
    target_citation_keywords JSONB DEFAULT '[]', -- Keywords for AI citation optimization
    competitive_expert_analysis JSONB DEFAULT '{}', -- Analysis of competing experts
    
    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_expert_activity TIMESTAMP,
    authority_building_since TIMESTAMP DEFAULT NOW()
);

-- GEO platform indexes
CREATE INDEX idx_geo_platform_priority ON geo_platform_accounts(platform_priority);
CREATE INDEX idx_geo_platform_authority ON geo_platform_accounts(platform_authority_level);
CREATE INDEX idx_geo_platform_type_authority ON geo_platform_accounts(platform_type, current_authority_score);
```

### Authority Content Templates (GEO-Optimized)

```sql
CREATE TABLE authority_content_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID REFERENCES admin_user(id) ON DELETE CASCADE,
    
    -- Template Classification
    template_name VARCHAR(100) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- comprehensive_article, expert_analysis, market_report, qa_answer
    authority_level VARCHAR(20) NOT NULL, -- beginner, intermediate, expert, thought_leader
    platform_optimization VARCHAR(50) NOT NULL, -- medium_longform, reddit_discussion, quora_answer
    
    -- GEO Optimization Configuration
    geo_optimization_score DECIMAL(3,2) DEFAULT 0.00, -- 0-1 GEO optimization level
    ai_citation_potential VARCHAR(20) DEFAULT 'medium', -- low, medium, high, very_high
    target_ai_queries JSONB DEFAULT '[]', -- Queries this content should answer
    authority_signals_included JSONB DEFAULT '[]', -- Expert credibility elements
    
    -- Content Structure (Authority-Focused)
    expert_headline_template VARCHAR(500), -- Headlines that establish authority
    credibility_establishment_framework TEXT, -- How to establish expert credibility
    comprehensive_content_structure JSONB NOT NULL, -- Structure for thorough coverage
    data_integration_guidance TEXT, -- How to include supporting data
    expert_conclusion_framework TEXT, -- How to conclude with authority
    
    -- Philippines Real Estate Focus
    market_expertise_areas JSONB NOT NULL, -- Philippines market topics covered
    buyer_segment_targeting JSONB NOT NULL, -- Which buyer personas this serves
    local_knowledge_integration JSONB DEFAULT '[]', -- Local insights to include
    regulatory_compliance_notes TEXT, -- Legal/regulatory considerations
    
    -- AI Citation Optimization Elements
    question_answer_format BOOLEAN DEFAULT false, -- Structured for AI Q&A
    factual_data_requirements JSONB DEFAULT '[]', -- Required supporting data
    expert_opinion_sections JSONB DEFAULT '[]', -- Where to include expert analysis
    citation_worthy_insights JSONB DEFAULT '[]', -- Key insights AI engines will cite
    
    -- Content Depth and Quality
    target_word_count_range VARCHAR(20) DEFAULT '2000-4000', -- Comprehensive content length
    research_requirements JSONB DEFAULT '[]', -- Research needed for authority
    expert_voice_guidelines TEXT, -- How to maintain expert tone
    competitive_differentiation TEXT, -- How to stand out from other experts
    
    -- Lead Generation Integration (Subtle)
    authority_to_consultation_hooks JSONB DEFAULT '[]', -- Natural consultation invitations
    expert_contact_integration TEXT, -- How to offer additional expert guidance
    island_properties_connection TEXT, -- Subtle business connection approach
    trust_building_elements JSONB DEFAULT '[]', -- Elements that build reader trust
    
    -- Performance Optimization
    usage_count INTEGER DEFAULT 0,
    authority_building_effectiveness DECIMAL(5,2) DEFAULT 0.00, -- Authority building success
    ai_citation_generation_rate DECIMAL(5,4) DEFAULT 0.0000, -- Citations per use
    lead_generation_rate DECIMAL(5,4) DEFAULT 0.0000, -- Leads per content piece
    expert_recognition_impact DECIMAL(3,2) DEFAULT 0.00, -- Impact on expert recognition
    
    -- Template Evolution
    optimization_version INTEGER DEFAULT 1, -- Template version for A/B testing
    performance_data JSONB DEFAULT '{}', -- Performance metrics and insights
    improvement_suggestions JSONB DEFAULT '[]', -- Suggested optimizations
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_optimization_date TIMESTAMP DEFAULT NOW()
);

-- Authority content template indexes
CREATE INDEX idx_authority_templates_type ON authority_content_templates(content_type);
CREATE INDEX idx_authority_templates_platform ON authority_content_templates(platform_optimization);
CREATE INDEX idx_authority_templates_geo_score ON authority_content_templates(geo_optimization_score);
CREATE INDEX idx_authority_templates_authority_level ON authority_content_templates(authority_level);
```

### Authority Content Publications (Expert Content Tracking)

```sql
CREATE TABLE authority_content_publications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    persona_id UUID REFERENCES expert_personas(id) ON DELETE CASCADE,
    platform_account_id UUID REFERENCES geo_platform_accounts(id) ON DELETE CASCADE,
    content_template_id UUID REFERENCES authority_content_templates(id),
    
    -- Content Classification
    content_type VARCHAR(50) NOT NULL, -- comprehensive_article, expert_analysis, market_report, expert_answer
    platform_type VARCHAR(50) NOT NULL, -- medium, reddit, quora, facebook, linkedin
    authority_level VARCHAR(20) NOT NULL, -- expert, thought_leader, industry_authority
    
    -- Content Details
    headline VARCHAR(500) NOT NULL,
    content_summary TEXT NOT NULL,
    full_content_encrypted TEXT NOT NULL, -- AES-256-GCM encrypted full content
    word_count INTEGER NOT NULL,
    expert_byline TEXT, -- Author bio and credentials
    
    -- GEO Optimization Implementation
    geo_optimization_applied JSONB NOT NULL, -- GEO optimizations implemented
    target_ai_queries JSONB DEFAULT '[]', -- AI queries this content targets
    authority_signals_used JSONB DEFAULT '[]', -- Expert credibility signals included
    citation_optimization_elements JSONB DEFAULT '[]', -- Elements optimized for AI citation
    structured_data_included BOOLEAN DEFAULT false, -- Schema markup for AI consumption
    
    -- Expert Positioning Elements
    expertise_demonstration JSONB DEFAULT '[]', -- How expertise was demonstrated
    credibility_establishment TEXT, -- How expert credibility was established
    market_insights_included JSONB DEFAULT '[]', -- Philippines market insights shared
    data_sources_cited JSONB DEFAULT '[]', -- Authoritative sources referenced
    
    -- Publication Details
    published_at TIMESTAMP NOT NULL,
    platform_url TEXT, -- Direct URL to published content
    publication_method VARCHAR(20) DEFAULT 'manual', -- manual, scheduled, optimized_timing
    content_distribution_strategy JSONB DEFAULT '{}', -- How content was distributed
    
    -- Authority Building Performance
    expert_engagement_metrics JSONB DEFAULT '{}', -- Quality engagement (not just quantity)
    authority_recognition_signals INTEGER DEFAULT 0, -- Expert recognition indicators
    thought_leadership_indicators INTEGER DEFAULT 0, -- Thought leadership signals
    professional_shares INTEGER DEFAULT 0, -- Shares by industry professionals
    expert_mentions INTEGER DEFAULT 0, -- Mentions by other experts
    
    -- AI Citation Tracking
    estimated_ai_citations INTEGER DEFAULT 0, -- Estimated times cited by AI
    ai_citation_tracking_data JSONB DEFAULT '{}', -- AI citation monitoring results
    search_visibility_impact DECIMAL(5,2) DEFAULT 0.00, -- Impact on search visibility
    authority_score_contribution DECIMAL(3,2) DEFAULT 0.00, -- Contribution to overall authority
    
    -- Lead Generation from Authority
    authority_driven_inquiries INTEGER DEFAULT 0, -- Inquiries from expert positioning
    consultation_requests INTEGER DEFAULT 0, -- Direct consultation requests
    expert_contact_attempts INTEGER DEFAULT 0, -- Attempts to contact as expert
    lead_quality_score DECIMAL(3,2) DEFAULT 0.00, -- Quality of generated leads
    
    -- Content Lifecycle Management
    content_freshness_score DECIMAL(3,2) DEFAULT 1.00, -- How current/relevant content remains
    update_requirements JSONB DEFAULT '[]', -- What updates might be needed
    evergreen_potential DECIMAL(3,2) DEFAULT 0.00, -- Long-term value potential
    competitive_positioning TEXT, -- How content positions against competitors
    
    -- Performance Analytics
    roi_attribution DECIMAL(10,2) DEFAULT 0.00, -- Revenue attributed to this content
    cost_per_lead_from_content DECIMAL(8,2) DEFAULT 0.00, -- Cost efficiency metric
    authority_building_impact DECIMAL(3,2) DEFAULT 0.00, -- Impact on overall expert status
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_performance_review TIMESTAMP DEFAULT NOW()
);

-- Authority content performance indexes
CREATE INDEX idx_authority_content_platform ON authority_content_publications(platform_type);
CREATE INDEX idx_authority_content_authority_level ON authority_content_publications(authority_level);
CREATE INDEX idx_authority_content_published ON authority_content_publications(published_at);
CREATE INDEX idx_authority_content_citations ON authority_content_publications(estimated_ai_citations);
CREATE INDEX idx_authority_content_roi ON authority_content_publications(roi_attribution);
```

### AI Citation Tracking System

```sql
CREATE TABLE ai_citation_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Content Being Tracked
    content_publication_id UUID REFERENCES authority_content_publications(id) ON DELETE CASCADE,
    persona_id UUID REFERENCES expert_personas(id) ON DELETE CASCADE,
    platform_type VARCHAR(50) NOT NULL,
    
    -- AI Engine Citation Data
    ai_engine VARCHAR(50) NOT NULL, -- chatgpt, claude, bard, perplexity, bing_copilot
    citation_type VARCHAR(30) NOT NULL, -- direct_quote, paraphrase, reference, authority_mention
    citation_context TEXT, -- Context in which content was cited
    user_query_category VARCHAR(100), -- Type of query that triggered citation
    
    -- Citation Tracking Details
    estimated_citation_date DATE NOT NULL,
    citation_confidence_score DECIMAL(3,2) DEFAULT 0.50, -- Confidence in citation estimate
    citation_evidence JSONB DEFAULT '{}', -- Evidence/indicators of citation
    monitoring_method VARCHAR(50) NOT NULL, -- how_citation_was_detected
    
    -- Citation Impact Assessment
    citation_reach_estimate INTEGER DEFAULT 0, -- Estimated users who saw citation
    authority_impact_score DECIMAL(3,2) DEFAULT 0.00, -- Impact on expert authority
    brand_exposure_value DECIMAL(8,2) DEFAULT 0.00, -- Estimated brand exposure value
    lead_generation_attribution INTEGER DEFAULT 0, -- Leads attributed to this citation
    
    -- Citation Context Analysis
    user_intent_category VARCHAR(50), -- investment_advice, market_research, buying_guidance
    geographic_relevance VARCHAR(50), -- philippines_specific, southeast_asia, international
    buyer_persona_match VARCHAR(50), -- Which buyer persona the query likely represents
    competition_analysis JSONB DEFAULT '{}', -- How citation compared to competitors
    
    -- Business Impact Tracking
    estimated_inquiry_influence INTEGER DEFAULT 0, -- Inquiries influenced by citation
    consultation_requests_attributed INTEGER DEFAULT 0, -- Consultations from citation
    revenue_impact_estimate DECIMAL(10,2) DEFAULT 0.00, -- Estimated revenue impact
    cost_per_citation DECIMAL(8,2) DEFAULT 0.00, -- Cost to generate this citation
    
    -- Citation Quality Assessment
    citation_quality_score DECIMAL(3,2) DEFAULT 0.00, -- Quality of the citation
    user_satisfaction_indicators JSONB DEFAULT '{}', -- Signs of user satisfaction
    follow_up_engagement_evidence JSONB DEFAULT '{}', -- Evidence of follow-up interest
    expert_recognition_signals JSONB DEFAULT '{}', -- Expert recognition from citation
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- AI citation tracking indexes
CREATE INDEX idx_ai_citation_engine ON ai_citation_tracking(ai_engine);
CREATE INDEX idx_ai_citation_date ON ai_citation_tracking(estimated_citation_date);
CREATE INDEX idx_ai_citation_persona ON ai_citation_tracking(persona_id);
CREATE INDEX idx_ai_citation_impact ON ai_citation_tracking(authority_impact_score);
```

### Authority-Based Lead Generation Tracking

```sql
CREATE TABLE authority_lead_generation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Expert Authority Attribution
    persona_id UUID REFERENCES expert_personas(id) ON DELETE CASCADE,
    platform_account_id UUID REFERENCES geo_platform_accounts(id) ON DELETE CASCADE,
    content_publication_id UUID REFERENCES authority_content_publications(id),
    ai_citation_id UUID REFERENCES ai_citation_tracking(id), -- If lead came via AI citation
    
    -- Lead Source Classification
    lead_source_type VARCHAR(50) NOT NULL, -- direct_article_read, ai_citation_discovery, expert_recommendation
    discovery_method VARCHAR(50) NOT NULL, -- organic_search, ai_engine_response, social_share, expert_referral
    initial_touchpoint VARCHAR(100) NOT NULL, -- What first brought them to the expert content
    
    -- Lead Details
    lead_identifier VARCHAR(255), -- Anonymized lead tracking identifier
    lead_quality_score DECIMAL(3,2) DEFAULT 0.00, -- 0-1 lead quality assessment
    buyer_persona_match VARCHAR(50), -- Which target buyer persona they match
    geographic_location VARCHAR(100), -- Lead's geographic location
    
    -- Expert Authority Influence
    authority_influence_score DECIMAL(3,2) DEFAULT 0.00, -- How much expert status influenced lead
    content_consumption_pattern JSONB DEFAULT '{}', -- What expert content they consumed
    expertise_validation_signals JSONB DEFAULT '[]', -- How they validated expertise
    trust_building_progression JSONB DEFAULT '[]', -- Trust building journey
    
    -- Inquiry and Engagement Details
    initial_inquiry_type VARCHAR(50) NOT NULL, -- general_question, specific_guidance, consultation_request
    inquiry_content_encrypted TEXT, -- AES-256-GCM encrypted inquiry details
    expertise_areas_of_interest JSONB DEFAULT '[]', -- Philippines real estate areas of interest
    investment_timeline VARCHAR(50), -- immediate, 6_months, 1_year, 2_plus_years
    budget_indication VARCHAR(50), -- Budget range if indicated
    
    -- Expert Engagement Process
    expert_response_method VARCHAR(50), -- direct_message, email, consultation_booking, content_recommendation
    consultation_requested BOOLEAN DEFAULT false, -- Whether they requested expert consultation
    island_properties_referral_made BOOLEAN DEFAULT false, -- Whether referred to Island Properties
    follow_up_engagement_level VARCHAR(30) DEFAULT 'initial', -- initial, engaged, qualified, converted
    
    -- Conversion Tracking
    qualified_lead_status BOOLEAN DEFAULT false, -- Whether lead qualified for Island Properties
    consultation_completed BOOLEAN DEFAULT false, -- Whether expert consultation completed
    island_properties_contact_made BOOLEAN DEFAULT false, -- Whether contact made with business
    conversion_outcome VARCHAR(50) DEFAULT 'pending', -- pending, qualified, unqualified, converted
    
    -- Authority-Specific Metrics
    expert_credibility_validation JSONB DEFAULT '{}', -- How they validated expert credibility
    competitive_expert_comparison JSONB DEFAULT '{}', -- Whether they compared to other experts
    authority_based_trust_score DECIMAL(3,2) DEFAULT 0.00, -- Trust level based on authority
    expertise_influence_on_decision DECIMAL(3,2) DEFAULT 0.00, -- How expertise influenced decision
    
    -- Lead Nurturing Through Expertise
    expert_content_recommendations JSONB DEFAULT '[]', -- Content recommended to lead
    additional_expertise_shared JSONB DEFAULT '[]', -- Additional expert insights provided
    relationship_building_activities JSONB DEFAULT '[]', -- Trust and relationship building actions
    expert_positioning_reinforcement JSONB DEFAULT '[]', -- How expertise was reinforced
    
    -- Business Impact
    estimated_lead_value DECIMAL(10,2) DEFAULT 0.00, -- Estimated value of this lead
    conversion_probability DECIMAL(3,2) DEFAULT 0.00, -- Probability of conversion
    revenue_attribution DECIMAL(12,2) DEFAULT 0.00, -- Revenue attributed to this lead
    roi_contribution DECIMAL(10,2) DEFAULT 0.00, -- ROI contribution from this lead
    
    -- Lead Journey Analytics
    total_touchpoints INTEGER DEFAULT 1, -- Total interactions before inquiry
    content_consumption_duration INTEGER, -- Time spent consuming expert content
    decision_influence_factors JSONB DEFAULT '[]', -- Factors that influenced their interest
    competitive_consideration_set JSONB DEFAULT '[]', -- Other experts/services considered
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_engagement TIMESTAMP DEFAULT NOW(),
    conversion_date TIMESTAMP
);

-- Authority-based lead generation indexes
CREATE INDEX idx_authority_leads_persona ON authority_lead_generation(persona_id);
CREATE INDEX idx_authority_leads_source ON authority_lead_generation(lead_source_type);
CREATE INDEX idx_authority_leads_quality ON authority_lead_generation(lead_quality_score);
CREATE INDEX idx_authority_leads_qualified ON authority_lead_generation(qualified_lead_status);
CREATE INDEX idx_authority_leads_converted ON authority_lead_generation(conversion_outcome);
```

### GEO Performance Analytics

```sql
CREATE TABLE geo_performance_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Analysis Period and Scope
    analysis_period VARCHAR(20) NOT NULL, -- daily, weekly, monthly, quarterly
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    persona_id UUID REFERENCES expert_personas(id) ON DELETE CASCADE,
    platform_type VARCHAR(50), -- NULL for cross-platform analysis
    
    -- Authority Building Performance
    authority_metrics JSONB NOT NULL DEFAULT '{}', -- Authority building progress
    expert_recognition_growth DECIMAL(5,2) DEFAULT 0.00, -- Growth in expert recognition
    thought_leadership_indicators INTEGER DEFAULT 0, -- Thought leadership signals
    competitive_positioning_score DECIMAL(3,2) DEFAULT 0.00, -- Position vs other experts
    
    -- AI Citation Performance
    ai_citation_metrics JSONB NOT NULL DEFAULT '{}', -- AI citation tracking results
    estimated_monthly_citations INTEGER DEFAULT 0, -- Estimated AI citations
    citation_quality_score DECIMAL(3,2) DEFAULT 0.00, -- Quality of citations received
    ai_authority_score DECIMAL(5,2) DEFAULT 0.00, -- Authority score with AI engines
    search_visibility_improvement DECIMAL(5,2) DEFAULT 0.00, -- Search visibility gains
    
    -- Content Authority Performance
    content_authority_metrics JSONB NOT NULL DEFAULT '{}', -- Content performance
    average_content_depth_score DECIMAL(3,2) DEFAULT 0.00, -- Content comprehensiveness
    expert_engagement_quality DECIMAL(3,2) DEFAULT 0.00, -- Quality of engagement received
    authority_content_reach INTEGER DEFAULT 0, -- Reach of authority content
    expertise_validation_rate DECIMAL(5,4) DEFAULT 0.0000, -- Rate of expertise validation
    
    -- Lead Generation from Authority
    authority_lead_metrics JSONB NOT NULL DEFAULT '{}', -- Authority-based lead generation
    expert_inquiries_generated INTEGER DEFAULT 0, -- Inquiries from expert positioning
    consultation_requests INTEGER DEFAULT 0, -- Direct consultation requests
    authority_to_lead_conversion DECIMAL(5,4) DEFAULT 0.0000, -- Authority → lead rate
    lead_quality_from_authority DECIMAL(3,2) DEFAULT 0.00, -- Quality of authority leads
    
    -- Business Impact Analysis
    revenue_attribution DECIMAL(12,2) DEFAULT 0.00, -- Revenue attributed to authority
    cost_per_authority_lead DECIMAL(8,2) DEFAULT 0.00, -- Cost per authority-generated lead
    roi_from_authority_building DECIMAL(8,4) DEFAULT 0.0000, -- ROI from expert positioning
    brand_authority_value DECIMAL(10,2) DEFAULT 0.00, -- Estimated brand authority value
    
    -- Competitive Analysis
    competitive_metrics JSONB DEFAULT '{}', -- Performance vs competitors
    market_share_of_voice DECIMAL(5,2) DEFAULT 0.00, -- Share of expert voice in market
    authority_differentiation_score DECIMAL(3,2) DEFAULT 0.00, -- Uniqueness of authority
    expert_ranking_position INTEGER, -- Ranking among Philippines real estate experts
    
    -- Platform-Specific Performance
    platform_authority_metrics JSONB DEFAULT '{}', -- Authority performance by platform
    platform_lead_generation JSONB DEFAULT '{}', -- Lead generation by platform
    platform_roi_breakdown JSONB DEFAULT '{}', -- ROI breakdown by platform
    cross_platform_synergy_score DECIMAL(3,2) DEFAULT 0.00, -- Cross-platform authority boost
    
    -- Future Optimization Insights
    optimization_opportunities JSONB DEFAULT '[]', -- Identified optimization opportunities
    authority_building_recommendations JSONB DEFAULT '[]', -- Recommendations for authority growth
    content_strategy_insights JSONB DEFAULT '[]', -- Content strategy optimization insights
    lead_generation_optimization JSONB DEFAULT '[]', -- Lead generation improvement suggestions
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- GEO performance analytics indexes
CREATE INDEX idx_geo_analytics_period ON geo_performance_analytics(analysis_period, period_start_date);
CREATE INDEX idx_geo_analytics_persona ON geo_performance_analytics(persona_id);
CREATE INDEX idx_geo_analytics_platform ON geo_performance_analytics(platform_type);
CREATE INDEX idx_geo_analytics_roi ON geo_performance_analytics(roi_from_authority_building);
```

### Cost Management (GEO-Optimized)

```sql
CREATE TABLE geo_cost_management (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month_year VARCHAR(7) NOT NULL, -- 'YYYY-MM' format
    
    -- Budget Allocation for GEO Strategy
    total_monthly_budget DECIMAL(8,2) DEFAULT 6.35, -- $6.35/month proxy constraint
    proxy_infrastructure_budget DECIMAL(8,2) DEFAULT 6.35, -- Dedicated IPs for authority
    content_creation_time_budget DECIMAL(6,2) DEFAULT 0.00, -- Time investment tracking
    
    -- GEO Platform Cost Allocation
    medium_content_creation_cost DECIMAL(6,2) DEFAULT 0.00, -- Time cost for comprehensive articles
    reddit_engagement_cost DECIMAL(6,2) DEFAULT 0.00, -- Time cost for community engagement
    quora_answer_creation_cost DECIMAL(6,2) DEFAULT 0.00, -- Time cost for expert answers
    cross_platform_optimization_cost DECIMAL(6,2) DEFAULT 0.00, -- Time cost for content adaptation
    
    -- Actual Spending Tracking
    proxy_costs_actual DECIMAL(8,2) DEFAULT 0.00,
    content_creation_time_actual DECIMAL(6,2) DEFAULT 0.00, -- Hours spent on authority content
    total_geo_investment DECIMAL(8,2) DEFAULT 0.00,
    
    -- GEO Performance ROI
    authority_building_roi DECIMAL(8,4) DEFAULT 0.0000, -- ROI from authority building
    ai_citation_value_generated DECIMAL(10,2) DEFAULT 0.00, -- Value from AI citations
    expert_inquiry_revenue DECIMAL(12,2) DEFAULT 0.00, -- Revenue from expert positioning
    cost_per_authority_lead DECIMAL(8,2) DEFAULT 0.00, -- Cost efficiency metric
    
    -- Budget Efficiency Analysis
    cost_per_ai_citation DECIMAL(6,2) DEFAULT 0.00, -- Cost per estimated AI citation
    content_creation_efficiency DECIMAL(8,4) DEFAULT 0.0000, -- Leads per hour of content creation
    platform_cost_effectiveness JSONB DEFAULT '{}', -- ROI by platform
    authority_building_efficiency DECIMAL(6,4) DEFAULT 0.0000, -- Authority score per dollar spent
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_geo_cost_month ON geo_cost_management(month_year);
CREATE INDEX idx_geo_cost_roi ON geo_cost_management(authority_building_roi);
```

## Data Encryption Strategy (GEO-Focused)

### Expert Content Protection

```typescript
interface GEOEncryptionArchitecture {
  // Expert Content Security
  expertContentProtection: {
    comprehensiveArticles: 'AES-256-GCM'; // Protect valuable long-form content
    marketAnalysisData: 'AES-256-GCM'; // Protect proprietary market insights
    expertiseCredentials: 'AES-256-GCM'; // Protect professional qualifications
    clientConsultationNotes: 'AES-256-GCM'; // Protect consultation details
  };
  
  // AI Citation Tracking Security
  citationTrackingProtection: {
    aiEngineResponseData: 'AES-256-GCM'; // Protect AI interaction data
    competitiveIntelligence: 'AES-256-GCM'; // Protect competitor analysis
    leadAttributionData: 'AES-256-GCM'; // Protect lead source attribution
    performanceMetrics: 'AES-256-GCM'; // Protect business performance data
  };
  
  // Authority Building Protection
  authorityAssetSecurity: {
    expertPersonaDevelopment: 'AES-256-GCM'; // Protect persona development
    thoughtLeadershipStrategy: 'AES-256-GCM'; // Protect strategy documents
    contentCalendarPlanning: 'AES-256-GCM'; // Protect content planning
    expertNetworkingData: 'AES-256-GCM'; // Protect professional relationships
  };
}
```

## Performance Optimization (Authority-Focused)

### Authority Building Analytics Views

```sql
-- Materialized view for expert authority dashboard
CREATE MATERIALIZED VIEW expert_authority_dashboard AS
SELECT 
    ep.id as persona_id,
    ep.expert_name,
    ep.expertise_focus,
    ep.primary_market_location,
    ep.current_authority_score,
    
    -- Authority Content Performance
    COUNT(acp.id) as total_authority_content,
    AVG(acp.word_count) as average_content_depth,
    SUM(acp.estimated_ai_citations) as total_estimated_citations,
    AVG(acp.authority_score_contribution) as avg_authority_contribution,
    
    -- Lead Generation from Authority
    COUNT(alg.id) as total_authority_leads,
    COUNT(alg.id) FILTER (WHERE alg.qualified_lead_status = true) as qualified_authority_leads,
    AVG(alg.lead_quality_score) as avg_lead_quality,
    
    -- Platform Authority Distribution
    COUNT(gpa.id) as active_platforms,
    AVG(gpa.platform_authority_level::text::int) as avg_platform_authority,
    
    -- ROI Metrics
    COALESCE(AVG(gpa.monthly_roi), 0) as avg_monthly_roi,
    COALESCE(SUM(alg.estimated_lead_value), 0) as total_estimated_lead_value,
    
    -- Recent Activity
    ep.last_content_creation,
    MAX(acp.published_at) as last_authority_content_published
    
FROM expert_personas ep
LEFT JOIN authority_content_publications acp ON ep.id = acp.persona_id
LEFT JOIN authority_lead_generation alg ON ep.id = alg.persona_id
LEFT JOIN geo_platform_accounts gpa ON ep.id = gpa.persona_id
WHERE ep.expert_status IN ('active', 'established', 'authority')
GROUP BY ep.id, ep.expert_name, ep.expertise_focus, ep.primary_market_location, 
         ep.current_authority_score, ep.last_content_creation;

-- Refresh schedule for authority dashboard
CREATE OR REPLACE FUNCTION refresh_expert_authority_dashboard() RETURNS void AS $
BEGIN
    REFRESH MATERIALIZED VIEW expert_authority_dashboard;
END;
$ LANGUAGE plpgsql;

-- Schedule refresh every 2 hours for real-time authority tracking
SELECT cron.schedule('refresh-authority-dashboard', '0 */2 * * *', 'SELECT refresh_expert_authority_dashboard();');
```

### GEO Performance Optimization Queries

```sql
-- Optimized query for authority content performance analysis
CREATE OR REPLACE FUNCTION get_authority_content_performance(persona_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    content_performance JSONB,
    ai_citation_trends JSONB,
    authority_building_progress JSONB,
    lead_generation_attribution JSONB,
    optimization_recommendations JSONB
) AS $
BEGIN
    RETURN QUERY
    SELECT 
        -- Content Performance Analysis
        jsonb_build_object(
            'total_content_pieces', COUNT(acp.id),
            'average_word_count', AVG(acp.word_count),
            'content_depth_score', AVG(acp.word_count::float / 2000), -- Normalize to 2000 words
            'geo_optimization_score', AVG((acp.geo_optimization_applied->'score')::text::float),
            'authority_signals_avg', AVG(jsonb_array_length(acp.authority_signals_used))
        ) as content_performance,
        
        -- AI Citation Trends
        jsonb_build_object(
            'estimated_citations_total', SUM(acp.estimated_ai_citations),
            'citation_growth_rate', COALESCE(
                (SUM(acp.estimated_ai_citations) FILTER (WHERE acp.published_at > NOW() - INTERVAL '15 days') * 2.0) /
                NULLIF(SUM(acp.estimated_ai_citations) FILTER (WHERE acp.published_at <= NOW() - INTERVAL '15 days'), 0) - 1, 0
            ),
            'citation_quality_score', AVG(
                CASE 
                    WHEN (acp.ai_citation_tracking_data->>'citation_confidence_score')::float > 0 
                    THEN (acp.ai_citation_tracking_data->>'citation_confidence_score')::float 
                    ELSE 0.5 
                END
            ),
            'top_citing_platforms', (
                SELECT jsonb_agg(DISTINCT platform_type ORDER BY platform_type)
                FROM authority_content_publications acp2
                WHERE acp2.persona_id = persona_uuid
                AND acp2.published_at > NOW() - INTERVAL '%s days'::text, days_back
                AND acp2.estimated_ai_citations > 0
            )
        ) as ai_citation_trends,
        
        -- Authority Building Progress
        jsonb_build_object(
            'authority_score_growth', (
                SELECT ep.current_authority_score 
                FROM expert_personas ep 
                WHERE ep.id = persona_uuid
            ),
            'expert_recognition_signals', SUM(acp.authority_recognition_signals),
            'thought_leadership_indicators', SUM(acp.thought_leadership_indicators),
            'platform_authority_distribution', (
                SELECT jsonb_object_agg(
                    gpa.platform_type, 
                    jsonb_build_object(
                        'authority_level', gpa.platform_authority_level,
                        'reputation_score', gpa.account_reputation_score,
                        'expert_recognition', gpa.expert_recognition_signals
                    )
                )
                FROM geo_platform_accounts gpa
                WHERE gpa.persona_id = persona_uuid
                AND gpa.account_status IN ('active', 'established', 'expert_recognized')
            )
        ) as authority_building_progress,
        
        -- Lead Generation Attribution
        jsonb_build_object(
            'authority_leads_generated', (
                SELECT COUNT(*) 
                FROM authority_lead_generation alg 
                WHERE alg.persona_id = persona_uuid 
                AND alg.created_at > NOW() - INTERVAL '%s days'::text, days_back
            ),
            'qualified_leads_percentage', (
                SELECT 
                    CASE 
                        WHEN COUNT(*) > 0 
                        THEN (COUNT(*) FILTER (WHERE qualified_lead_status = true) * 100.0 / COUNT(*))
                        ELSE 0 
                    END
                FROM authority_lead_generation alg
                WHERE alg.persona_id = persona_uuid
                AND alg.created_at > NOW() - INTERVAL '%s days'::text, days_back
            ),
            'average_lead_quality', (
                SELECT COALESCE(AVG(lead_quality_score), 0)
                FROM authority_lead_generation alg
                WHERE alg.persona_id = persona_uuid
                AND alg.created_at > NOW() - INTERVAL '%s days'::text, days_back
            ),
            'consultation_conversion_rate', (
                SELECT 
                    CASE 
                        WHEN COUNT(*) > 0 
                        THEN (COUNT(*) FILTER (WHERE consultation_requested = true) * 100.0 / COUNT(*))
                        ELSE 0 
                    END
                FROM authority_lead_generation alg
                WHERE alg.persona_id = persona_uuid
                AND alg.created_at > NOW() - INTERVAL '%s days'::text, days_back
            )
        ) as lead_generation_attribution,
        
        -- Optimization Recommendations
        jsonb_build_object(
            'content_optimization', CASE
                WHEN AVG(acp.word_count) < 2000 THEN jsonb_build_array('Increase content depth for better AI citation potential')
                WHEN AVG((acp.geo_optimization_applied->'score')::text::float) < 0.7 THEN jsonb_build_array('Improve GEO optimization implementation')
                ELSE jsonb_build_array('Content depth and optimization are performing well')
            END,
            'authority_building', CASE
                WHEN AVG(acp.authority_recognition_signals) < 5 THEN jsonb_build_array('Focus on building more authority signals in content')
                WHEN SUM(acp.estimated_ai_citations) < 10 THEN jsonb_build_array('Optimize content for higher AI citation potential')
                ELSE jsonb_build_array('Authority building is progressing well')
            END,
            'lead_generation', CASE
                WHEN (SELECT COUNT(*) FROM authority_lead_generation alg WHERE alg.persona_id = persona_uuid AND alg.created_at > NOW() - INTERVAL '%s days'::text, days_back) < 5 
                THEN jsonb_build_array('Increase lead generation focus in authority content')
                ELSE jsonb_build_array('Lead generation from authority is performing adequately')
            END
        ) as optimization_recommendations
        
    FROM authority_content_publications acp
    WHERE acp.persona_id = persona_uuid
    AND acp.published_at > NOW() - INTERVAL '%s days'::text, days_back;
END;
$ LANGUAGE plpgsql;
```

## Database Migration Strategy (GEO-Focused)

### GEO Schema Evolution Tracking

```sql
-- GEO-specific schema version tracking
CREATE TABLE geo_schema_migrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version VARCHAR(50) NOT NULL UNIQUE,
    migration_type VARCHAR(30) NOT NULL, -- authority_building, ai_citation, content_optimization
    description TEXT NOT NULL,
    migration_sql TEXT NOT NULL,
    rollback_sql TEXT,
    business_impact TEXT, -- How this affects lead generation
    applied_at TIMESTAMP DEFAULT NOW(),
    applied_by VARCHAR(100) DEFAULT 'system'
);

-- Initial GEO schema versions
INSERT INTO geo_schema_migrations (version, migration_type, description, migration_sql, business_impact) VALUES
('1.0.0-geo', 'authority_building', 'Initial GEO-optimized schema for authority-based lead generation', 'Initial schema creation', 'Establishes foundation for authority-based lead generation system'),
('1.1.0-geo', 'ai_citation', 'AI citation tracking and optimization system', 'AI citation tables and tracking', 'Enables measurement of AI engine citation impact on lead generation'),
('1.2.0-geo', 'content_optimization', 'Advanced content optimization for authority building', 'Content optimization tables', 'Improves content creation efficiency and authority building effectiveness');
```

### Backup Strategy (Authority Content Protection)

```sql
-- Authority content backup configuration
CREATE TABLE geo_backup_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    backup_type VARCHAR(30) NOT NULL, -- authority_content, ai_citation_data, lead_attribution
    backup_priority VARCHAR(20) NOT NULL, -- critical, high, medium, low
    schedule_cron VARCHAR(50) NOT NULL,
    retention_days INTEGER NOT NULL,
    encryption_level VARCHAR(20) DEFAULT 'high', -- Authority content needs strong protection
    backup_location VARCHAR(255) NOT NULL,
    
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- GEO-specific backup configurations
INSERT INTO geo_backup_configurations (backup_type, backup_priority, schedule_cron, retention_days, backup_location) VALUES
('authority_content', 'critical', '0 */6 * * *', 180, 'encrypted_local_authority_content'), -- Every 6 hours, 180-day retention
('ai_citation_data', 'high', '0 2 * * *', 90, 'encrypted_local_citation_data'), -- Daily at 2 AM, 90-day retention
('lead_attribution', 'critical', '0 1 * * *', 365, 'encrypted_local_lead_data'), -- Daily at 1 AM, 1-year retention
('expert_performance', 'medium', '0 3 * * 0', 30, 'encrypted_local_performance'); -- Weekly, 30-day retention
```

## Development Environment Configuration (GEO-Optimized)

### GEO Development Settings

```sql
CREATE TABLE geo_development_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    config_category VARCHAR(30) NOT NULL, -- authority_building, content_creation, ai_optimization, lead_tracking
    environment VARCHAR(20) NOT NULL, -- development, staging, production
    business_impact TEXT, -- How this setting affects lead generation
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- GEO development environment settings
INSERT INTO geo_development_configurations (config_key, config_value, config_category, environment, business_impact) VALUES
('max_expert_personas_dev', '2', 'authority_building', 'development', 'Limited personas for development testing'),
('ai_citation_simulation_mode', 'true', 'ai_optimization', 'development', 'Simulate AI citations for testing optimization algorithms'),
('content_depth_minimum_dev', '500', 'content_creation', 'development', 'Reduced content requirements for development efficiency'),
('lead_generation_simulation', 'true', 'lead_tracking', 'development', 'Simulate lead generation for testing attribution systems'),
('authority_score_acceleration', '10x', 'authority_building', 'development', 'Accelerated authority building for faster development testing'),
('geo_optimization_testing', 'enabled', 'ai_optimization', 'development', 'Enable advanced GEO testing features'),
('medium_publication_simulation', 'true', 'content_creation', 'development', 'Simulate Medium publication process for development'),
('reddit_engagement_simulation', 'true', 'content_creation', 'development', 'Simulate Reddit engagement for development testing');
```

## System Health Monitoring (GEO-Specific)

### Authority Building Performance Monitoring

```sql
-- GEO-specific system health metrics
CREATE TABLE geo_system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_timestamp TIMESTAMP DEFAULT NOW(),
    
    -- Authority Building Performance
    total_expert_personas INTEGER DEFAULT 0,
    active_authority_building_personas INTEGER DEFAULT 0,
    average_authority_score DECIMAL(5,2) DEFAULT 0.00,
    authority_content_created_last_24h INTEGER DEFAULT 0,
    
    -- AI Citation Performance
    estimated_daily_ai_citations INTEGER DEFAULT 0,
    citation_quality_score_avg DECIMAL(3,2) DEFAULT 0.00,
    ai_optimization_success_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Content Authority Metrics
    comprehensive_articles_published_24h INTEGER DEFAULT 0,
    expert_answers_created_24h INTEGER DEFAULT 0,
    average_content_depth_score DECIMAL(3,2) DEFAULT 0.00,
    geo_optimization_implementation_rate DECIMAL(5,2) DEFAULT 0.00,
    
    -- Lead Generation from Authority
    authority_leads_generated_24h INTEGER DEFAULT 0,
    consultation_requests_24h INTEGER DEFAULT 0,
    expert_inquiries_24h INTEGER DEFAULT 0,
    authority_conversion_rate_24h DECIMAL(5,4) DEFAULT 0.0000,
    
    -- Platform Authority Distribution
    medium_authority_score DECIMAL(5,2) DEFAULT 0.00,
    reddit_reputation_score DECIMAL(5,2) DEFAULT 0.00,
    quora_expert_status_score DECIMAL(5,2) DEFAULT 0.00,
    cross_platform_authority_synergy DECIMAL(3,2) DEFAULT 0.00,
    
    -- Business Impact Metrics
    daily_roi_from_authority DECIMAL(10,4) DEFAULT 0.0000,
    cost_per_authority_lead DECIMAL(8,2) DEFAULT 0.00,
    authority_brand_value_growth DECIMAL(8,2) DEFAULT 0.00,
    competitive_positioning_score DECIMAL(3,2) DEFAULT 0.00,
    
    -- Technical Performance
    content_creation_system_response_time INTEGER DEFAULT 0,
    geo_optimization_processing_time INTEGER DEFAULT 0,
    authority_analytics_query_performance INTEGER DEFAULT 0,
    lead_attribution_tracking_accuracy DECIMAL(5,4) DEFAULT 1.0000,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Automated GEO health check function
CREATE OR REPLACE FUNCTION record_geo_system_health() RETURNS void AS $
DECLARE
    health_record geo_system_health_metrics%ROWTYPE;
BEGIN
    -- Collect GEO-specific system metrics
    SELECT 
        -- Authority Building Metrics
        (SELECT COUNT(*) FROM expert_personas WHERE expert_status IN ('active', 'established', 'authority')),
        (SELECT COUNT(*) FROM expert_personas WHERE expert_status = 'active' AND last_content_creation > NOW() - INTERVAL '24 hours'),
        (SELECT COALESCE(AVG(current_authority_score), 0) FROM expert_personas WHERE expert_status IN ('active', 'established', 'authority')),
        (SELECT COUNT(*) FROM authority_content_publications WHERE published_at > NOW() - INTERVAL '24 hours'),
        
        -- AI Citation Metrics
        (SELECT COALESCE(SUM(estimated_ai_citations), 0) FROM ai_citation_tracking WHERE estimated_citation_date > NOW() - INTERVAL '1 day'),
        (SELECT COALESCE(AVG(citation_quality_score), 0) FROM ai_citation_tracking WHERE created_at > NOW() - INTERVAL '24 hours'),
        (SELECT 
            CASE 
                WHEN COUNT(*) > 0 
                THEN (COUNT(*) FILTER (WHERE citation_confidence_score > 0.7) * 100.0 / COUNT(*))
                ELSE 0 
            END
        FROM ai_citation_tracking WHERE created_at > NOW() - INTERVAL '24 hours'),
        
        -- Lead Generation Metrics
        (SELECT COUNT(*) FROM authority_lead_generation WHERE created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(*) FROM authority_lead_generation WHERE consultation_requested = true AND created_at > NOW() - INTERVAL '24 hours'),
        (SELECT COUNT(*) FROM authority_lead_generation WHERE initial_inquiry_type = 'consultation_request' AND created_at > NOW() - INTERVAL '24 hours'),
        (SELECT 
            CASE 
                WHEN COUNT(*) > 0 
                THEN (COUNT(*) FILTER (WHERE qualified_lead_status = true) * 1.0 / COUNT(*))
                ELSE 0 
            END
        FROM authority_lead_generation WHERE created_at > NOW() - INTERVAL '24 hours')
        
    INTO health_record.total_expert_personas, health_record.active_authority_building_personas, 
         health_record.average_authority_score, health_record.authority_content_created_last_24h,
         health_record.estimated_daily_ai_citations, health_record.citation_quality_score_avg,
         health_record.ai_optimization_success_rate, health_record.authority_leads_generated_24h,
         health_record.consultation_requests_24h, health_record.expert_inquiries_24h,
         health_record.authority_conversion_rate_24h;
    
    -- Insert GEO health record
    INSERT INTO geo_system_health_metrics (
        total_expert_personas, active_authority_building_personas, average_authority_score,
        authority_content_created_last_24h, estimated_daily_ai_citations, citation_quality_score_avg,
        ai_optimization_success_rate, authority_leads_generated_24h, consultation_requests_24h,
        expert_inquiries_24h, authority_conversion_rate_24h
    ) VALUES (
        health_record.total_expert_personas, health_record.active_authority_building_personas,
        health_record.average_authority_score, health_record.authority_content_created_last_24h,
        health_record.estimated_daily_ai_citations, health_record.citation_quality_score_avg,
        health_record.ai_optimization_success_rate, health_record.authority_leads_generated_24h,
        health_record.consultation_requests_24h, health_record.expert_inquiries_24h,
        health_record.authority_conversion_rate_24h
    );
END;
$ LANGUAGE plpgsql;

-- Schedule GEO health checks every hour
SELECT cron.schedule('geo-system-health-check', '0 * * * *', 'SELECT record_geo_system_health();');
```

**Bottom Line:** This completely rewritten database architecture now properly supports the GEO strategy with:

- **Expert personas** instead of social media personas
- **Authority content tracking** instead of simple post tracking  
- **AI citation monitoring** instead of basic engagement metrics
- **Medium/Reddit/Quora optimization** instead of Facebook priority
- **Thought leadership ROI tracking** instead of social media vanity metrics
- **Expert positioning workflows** instead of lifestyle content flows

The schema now aligns with generating qualified leads through AI-cited expert authority rather than hoping for social media algorithm visibility.