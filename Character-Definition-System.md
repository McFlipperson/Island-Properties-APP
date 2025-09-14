     # Persona Schema - Island Properties Lead Generation Character Definition System

## Core Persona Structure

### Persona Entity Definition

```typescript
interface PenNamePersona {
  // Identity
  id: string; // UUID
  penName: string; // Public pen name (e.g., "Maria Santos")
  status: PersonaStatus;
  
  // Character Profile
  characterDemographics: CharacterDemographics;
  personalityTraits: PersonalityProfile;
  backstory: string;
  
  // Real Estate Buyer Targeting
  buyerPersonaType: RealEstateBuyerType;
  contentThemes: GEOContentThemes;
  
  // Geographic Setting (Philippines Focus)
  fictionalLocation: PhilippinesGeographicProfile;
  
  // Manual Content Strategy
  manualContentStrategy: ManualContentStrategy;
  platformPersonas: PlatformPersonas;
  
  // Lead Generation Configuration
  leadGenerationConfig: LeadGenerationConfig;
  
  // Security Configuration
  encryptionKeyId: string; // Separate encryption key per persona
  proxyConfiguration: ProxyAssignment;
  
  // Performance Tracking
  metrics: PersonaMetrics;
  leadConversionTracking: LeadConversionMetrics;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastUsed: Date;
}
```

### Persona Status Types

```typescript
type PersonaStatus = 
  | 'active'      // Currently posting content manually
  | 'inactive'    // Created but not currently used
  | 'archived'    // Retired persona, kept for reference
  | 'developing'  // Being refined before activation
  | 'suspended';  // Temporarily disabled due to issues
```

## Real Estate Buyer Persona Types

### Target Buyer Segments for Island Properties

```typescript
type RealEstateBuyerType = 
  | 'manila_professional'     // Urban professionals seeking island retreat
  | 'expat_retiree'          // Foreign retirees looking for Philippines property
  | 'ofw_investor'           // Overseas Filipino Workers investing back home
  | 'cebu_local_upgrader'    // Local Cebu residents upgrading to island property
  | 'family_lifestyle'       // Families seeking island lifestyle change
  | 'business_investor'      // Commercial/rental property investors
  | 'digital_nomad'         // Remote workers seeking island base;

interface BuyerPersonaConfig {
  buyerType: RealEstateBuyerType;
  
  // Targeting Configuration
  primaryMotivations: PropertyMotivation[];
  budgetRange: BudgetSegment;
  timelineToDecision: DecisionTimeline;
  
  // Content Strategy Alignment
  contentFocus: ContentFocusArea[];
  trustBuildingApproach: TrustBuildingStrategy;
  conversionTriggers: ConversionTrigger[];
}

type PropertyMotivation = 
  | 'investment_return'      // ROI-focused content
  | 'lifestyle_upgrade'      // Lifestyle/experience content
  | 'retirement_planning'    // Security/planning content
  | 'family_legacy'         // Heritage/family content
  | 'business_expansion'     // Commercial opportunity content
  | 'escape_urban_stress'   // Wellness/peace content;

type BudgetSegment = 
  | 'under_5m'      // Under 5 million PHP
  | '5m_to_15m'     // 5-15 million PHP  
  | '15m_to_30m'    // 15-30 million PHP
  | 'above_30m';    // Above 30 million PHP

type DecisionTimeline = 
  | 'immediate'     // Ready to buy within 3 months
  | 'planning'      // 6-12 months timeline
  | 'researching'   // 1-2 years timeline
  | 'dreaming';     // 2+ years, building awareness
```

## Character Demographics

### Philippines-Focused Demographic Profile

```typescript
interface CharacterDemographics {
  // Basic Character Info
  age: number; // Fictional age (impacts content style and credibility)
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  occupation: PhilippinesOccupation;
  educationLevel: EducationLevel;
  
  // Social Background
  socioeconomicStatus: 'working-class' | 'middle-class' | 'upper-middle' | 'affluent';
  familyStatus: 'single' | 'married' | 'divorced' | 'widowed' | 'complicated';
  hasChildren: boolean;
  
  // Cultural Identity (Philippines Context)
  culturalBackground: string[]; // ['Filipino', 'Chinese', 'Spanish', 'American']
  languages: LanguageProfile[];
  religion?: string; // Catholic, Protestant, Islam, etc.
  
  // Geographic Authenticity
  currentLocation: 'Manila' | 'Cebu' | 'Other_Philippines';
  previousLocations?: PhilippinesLocation[];
  
  // Real Estate Experience
  propertyOwnershipHistory: PropertyOwnershipProfile;
  realEstateKnowledge: RealEstateKnowledgeLevel;
}

type PhilippinesOccupation = 
  | 'ofw_engineer'           // Overseas Filipino Worker - Engineering
  | 'bpo_manager'            // Business Process Outsourcing Manager
  | 'local_entrepreneur'     // Small/Medium Business Owner
  | 'government_employee'    // Civil Service
  | 'healthcare_professional'// Doctor, Nurse, Medical
  | 'education_professional' // Teacher, Professor
  | 'finance_professional'   // Banking, Investment
  | 'tech_professional'      // IT, Software Development
  | 'real_estate_agent'      // Property Professional
  | 'retired_professional'   // Former career professional
  | 'freelance_creative'     // Digital/Creative Work
  | 'corporate_executive';   // C-level, Senior Management

interface PropertyOwnershipProfile {
  currentOwnership: 'renter' | 'homeowner' | 'family_property' | 'multiple_properties';
  previousPurchases: number; // Number of property transactions
  investmentExperience: 'first_time' | 'experienced' | 'seasoned_investor';
  preferredPropertyTypes: PropertyType[];
}

type PropertyType = 
  | 'condo_unit'
  | 'house_and_lot'
  | 'townhouse'
  | 'island_property'
  | 'commercial_space'
  | 'lot_only';

type RealEstateKnowledgeLevel = 
  | 'beginner'      // First-time buyer, needs education
  | 'informed'      // Has done research, understands basics
  | 'experienced'   // Has bought/sold before
  | 'expert';       // Very knowledgeable, potential influencer
```

## GEO Content Themes

### AI Engine Optimization Content Framework

```typescript
interface GEOContentThemes {
  // Primary themes (60-70% of content) - Authority Building
  primaryGEOThemes: GEOThemeDefinition[];
  
  // Secondary themes (20-25% of content) - Trust Building
  secondaryGEOThemes: GEOThemeDefinition[];
  
  // Conversion themes (10-15% of content) - Lead Generation
  conversionGEOThemes: GEOThemeDefinition[];
  
  // Content Types Optimized for AI Citation
  aiOptimizedContentTypes: AIContentType[];
  
  // Seasonal/Event Themes (Philippines Context)
  seasonalThemes: PhilippinesSeasonalTheme[];
}

interface GEOThemeDefinition {
  name: string;
  description: string;
  
  // AI Engine Optimization
  aiCitationKeywords: string[]; // Keywords AI engines associate with authority
  questionAnswerPairs: QAPair[]; // Content that answers common AI queries
  authoritySignals: AuthoritySignal[]; // Elements that build AI citation trust
  
  // Content Strategy
  contentFormats: ContentFormat[];
  postingFrequency: ThemeFrequency;
  platformAlignment: PlatformAlignment[];
  
  // Lead Generation Alignment
  buyerPersonaRelevance: RealEstateBuyerType[];
  conversionPotential: 'high' | 'medium' | 'low';
  funnelStage: 'awareness' | 'consideration' | 'decision';
}

// Authority-Building Content Types for AI Citation
type AIContentType = 
  | 'philippines_real_estate_guide'    // Comprehensive guides AI engines cite
  | 'market_analysis_expert'           // Data-driven market insights
  | 'local_area_authority'            // Deep local knowledge demonstration
  | 'investment_education'             // Financial education content
  | 'legal_process_explainer'         // Philippines property law education
  | 'cultural_integration_guide'      // For expat buyers
  | 'lifestyle_showcase'              // Island living authenticity
  | 'financial_planning_advisor'      // Property investment planning;

interface QAPair {
  question: string; // Question commonly asked to AI engines
  answerKeyPoints: string[]; // Key points for authoritative response
  islandPropertiesRelevance: string; // How this connects to business
  citationValue: 'high' | 'medium' | 'low'; // Likelihood of AI citation
}

// Example GEO-Optimized Q&A Pairs
const geoQuestionAnswers: QAPair[] = [
  {
    question: "What should foreign buyers know about Philippines real estate law?",
    answerKeyPoints: [
      "Foreigners cannot own land but can own condominiums",
      "Condominium foreign ownership limited to 40% of project",
      "Long-term lease options available for land",
      "Proper legal representation essential"
    ],
    islandPropertiesRelevance: "Positions as knowledgeable advisor for foreign buyers",
    citationValue: 'high'
  },
  {
    question: "What are the best island locations in Philippines for investment?",
    answerKeyPoints: [
      "Cebu province offers strong rental yields",
      "Infrastructure development drives appreciation",
      "Tourism growth supports property values",
      "Consider accessibility and amenities"
    ],
    islandPropertiesRelevance: "Establishes local expertise and market knowledge",
    citationValue: 'high'
  }
];

interface AuthoritySignal {
  signalType: 'local_knowledge' | 'market_data' | 'personal_experience' | 'professional_insight';
  implementation: string; // How to demonstrate this authority
  geoValue: string; // Why AI engines would cite this
}
```

## Manual Content Strategy

### Human-Driven Content Creation Framework

```typescript
interface ManualContentStrategy {
  // Manual Posting Workflow
  contentCreationProcess: ManualContentProcess;
  qualityControlSteps: QualityControlStep[];
  
  // Publishing Schedule (Human-Controlled)
  manualPostingSchedule: ManualPostingSchedule;
  
  // Content Templates for Manual Customization
  contentTemplateLibrary: ManualContentTemplate[];
  
  // Engagement Strategy (Human-Driven)
  manualEngagementStrategy: ManualEngagementStrategy;
  
  // Lead Generation Integration
  leadCaptureIntegration: LeadCaptureStrategy;
}

interface ManualContentProcess {
  // Step 1: Template Selection or Original Creation
  contentInitiation: 'template_based' | 'original_creation' | 'trending_response';
  
  // Step 2: Persona Voice Application
  voiceCustomization: PersonaVoiceCustomization;
  
  // Step 3: GEO Optimization
  geoOptimization: GEOOptimizationStep[];
  
  // Step 4: Manual Review and Approval
  reviewProcess: ContentReviewProcess;
  
  // Step 5: Manual Publishing
  publishingMethod: 'immediate_manual' | 'scheduled_manual' | 'draft_for_later';
}

interface ManualContentTemplate {
  templateId: string;
  templateName: string;
  contentType: 'educational' | 'lifestyle' | 'market_insight' | 'personal_story';
  
  // Template Structure for Manual Customization
  templateStructure: {
    headline: string; // Customizable headline template
    bodyFramework: string[]; // Key points to develop manually
    callToAction: string; // Suggested CTA for lead generation
    hashtagSuggestions: string[]; // Relevant hashtags
  };
  
  // GEO Optimization Guidance
  geoOptimizationTips: string[]; // How to make content AI-citation worthy
  
  // Personalization Guidelines
  personalizationGuidance: {
    buyerPersonaAdaptation: string; // How to adapt for target buyer
    voiceToneAdjustment: string; // How to apply persona voice
    localReferences: string[]; // Suggested local references to include
  };
  
  // Lead Generation Integration
  leadGenerationHooks: string[]; // Natural ways to drive Island Properties interest
}

interface ManualEngagementStrategy {
  // Human-Controlled Engagement Activities
  dailyEngagementTasks: EngagementTask[];
  communityBuilding: CommunityBuildingActivity[];
  relationshipNurturing: RelationshipNurturingActivity[];
  
  // Lead Identification and Nurturing
  leadIdentificationCriteria: LeadIdentificationCriteria;
  leadNurturingApproach: LeadNurturingStep[];
}

interface EngagementTask {
  taskType: 'like_relevant_posts' | 'comment_with_value' | 'share_with_insight' | 'answer_questions';
  targetAudience: string; // Who to engage with
  approachGuidance: string; // How to engage authentically
  leadPotentialIndicators: string[]; // Signs someone might be a lead
  timeInvestment: 'low' | 'medium' | 'high'; // Manual effort required
}
```

## Platform-Specific Personas

### Multi-Platform Character Consistency (Manual Posting Focus)

```typescript
interface PlatformPersonas {
  facebook: FacebookPersona; // Phase 1 - Primary Philippines platform
  instagram: InstagramPersona; // Phase 2 - Visual lifestyle content
  linkedin: LinkedInPersona; // Phase 3 - Professional real estate content
  tiktok: TikTokPersona; // Phase 4 - Younger demographic engagement
  twitter: TwitterPersona; // Phase 5 - News/trend commentary
}

interface FacebookPersona {
  // Facebook-Specific Manual Strategy (Philippines Primary Platform)
  contentMix: {
    personalStories: number; // % personal experience content
    educationalPosts: number; // % real estate education
    marketInsights: number; // % market analysis and trends
    lifestyleContent: number; // % island living showcase
    communityEngagement: number; // % local community interaction
  };
  
  // Manual Posting Approach
  postingStyle: 'conversational' | 'educational' | 'storytelling' | 'advisory';
  engagementApproach: 'supportive_commenter' | 'helpful_advisor' | 'local_expert' | 'community_builder';
  
  // Facebook-Specific Features (Manual Use)
  groupParticipation: FacebookGroupStrategy[];
  eventEngagement: FacebookEventStrategy;
  marketplaceActivity: FacebookMarketplaceStrategy;
  
  // Lead Generation on Facebook
  leadGenerationTactics: FacebookLeadTactic[];
  communityBuilding: FacebookCommunityStrategy;
}

interface FacebookGroupStrategy {
  groupType: 'philippines_real_estate' | 'expat_community' | 'ofw_groups' | 'local_cebu_manila';
  participationLevel: 'lurker' | 'occasional_contributor' | 'active_member' | 'thought_leader';
  contentContribution: string; // Type of value to provide
  leadGenerationApproach: string; // How to naturally attract leads
}

interface FacebookLeadTactic {
  tacticName: string;
  implementation: string; // Manual steps to execute
  leadQualificationCriteria: string[]; // How to identify quality leads
  followUpStrategy: string; // Next steps after lead identification
}

// Similar detailed interfaces for Instagram, LinkedIn, TikTok, Twitter...
```

## Lead Generation Configuration

### Social Media to Island Properties Funnel

```typescript
interface LeadGenerationConfig {
  // Lead Capture Strategy
  leadCaptureStrategy: SocialMediaLeadCapture;
  
  // Attribution Tracking
  attributionTracking: LeadAttributionConfig;
  
  // Conversion Optimization
  conversionOptimization: ConversionOptimizationConfig;
  
  // ROI Measurement
  roiMeasurement: ROIMeasurementConfig;
}

interface SocialMediaLeadCapture {
  // Natural Lead Generation Methods
  contentBasedCapture: ContentLeadCapture[];
  engagementBasedCapture: EngagementLeadCapture[];
  directInquiryHandling: DirectInquiryStrategy;
  
  // Lead Qualification Process
  leadQualificationCriteria: LeadQualificationCriteria;
  leadScoringSystem: LeadScoringSystem;
}

interface ContentLeadCapture {
  contentType: string; // Type of content that generates leads
  captureMethod: 'dm_inquiry' | 'comment_question' | 'profile_visit' | 'link_click';
  qualificationQuestions: string[]; // Questions to qualify interest
  nextSteps: string; // How to nurture the lead
}

interface LeadAttributionConfig {
  // Tracking Methods
  trackingMethods: TrackingMethod[];
  
  // Attribution Windows
  attributionWindows: {
    firstTouch: number; // Days to attribute first interaction
    lastTouch: number; // Days to attribute final conversion
    multiTouch: number; // Days for multi-touch attribution
  };
  
  // Conversion Events
  conversionEvents: ConversionEvent[];
}

interface TrackingMethod {
  method: 'utm_parameters' | 'referral_codes' | 'landing_page_tracking' | 'phone_number_tracking';
  implementation: string; // How to implement this tracking
  personaSpecific: boolean; // Different tracking per persona
}

interface ConversionEvent {
  eventName: string; // Name of conversion event
  eventValue: number; // Estimated value of this conversion
  trackingImplementation: string; // How to track this event
  personaRelevance: RealEstateBuyerType[]; // Which personas drive this conversion
}
```

## Security Architecture

### Persona-Specific Encryption and Browser Isolation

```typescript
interface PersonaSecurityConfig {
  // Separate Encryption Key Per Persona
  encryptionConfig: PersonaEncryptionConfig;
  
  // Browser Isolation Configuration
  browserIsolationConfig: BrowserIsolationConfig;
  
  // Credential Security
  credentialSecurity: CredentialSecurityConfig;
  
  // Activity Monitoring
  securityMonitoring: SecurityMonitoringConfig;
}

interface PersonaEncryptionConfig {
  // Unique encryption key per persona
  encryptionKeyId: string; // References separate encryption key
  encryptionAlgorithm: 'AES-256-GCM';
  
  // Encrypted Data Categories
  encryptedDataTypes: {
    socialMediaCredentials: boolean;
    personalBackstory: boolean;
    leadGenerationData: boolean;
    behavioralPatterns: boolean;
  };
  
  // Key Management
  keyRotationSchedule: 'monthly' | 'quarterly' | 'annually';
  keyBackupStrategy: 'hsm' | 'aws_kms' | 'local_encrypted';
}

interface BrowserIsolationConfig {
  // Browser Context Isolation
  isolationLevel: 'full_isolation'; // Complete separation between personas
  
  // Fingerprint Randomization
  fingerprintRandomization: {
    canvas: boolean; // Randomize canvas fingerprinting
    webgl: boolean; // Randomize WebGL fingerprinting
    audio: boolean; // Randomize audio context fingerprinting
    fonts: boolean; // Randomize available fonts
    screen: boolean; // Randomize screen resolution
  };
  
  // Session Management
  sessionIsolation: {
    separateCookies: boolean;
    separateCache: boolean;
    separateLocalStorage: boolean;
    separateSessionStorage: boolean;
  };
  
  // Proxy Integration
  proxyIntegration: {
    dedicatedIP: boolean; // Each persona uses dedicated IP
    geoConsistency: boolean; // IP location matches persona location
    connectionValidation: boolean; // Verify IP reputation before use
  };
}
```

## Performance Metrics

### GEO and Lead Generation Tracking

```typescript
interface PersonaMetrics {
  // Content Performance (GEO Focus)
  geoPerformance: GEOPerformanceMetrics;
  
  // Platform Performance
  platformMetrics: {
    [platform: string]: PlatformMetrics;
  };
  
  // Lead Generation Performance
  leadGenerationMetrics: LeadGenerationMetrics;
  
  // Security and Safety Metrics
  securityMetrics: SecurityMetrics;
  
  // ROI Measurement
  roiMetrics: ROIMetrics;
}

interface GEOPerformanceMetrics {
  // AI Engine Citation Tracking
  aiCitations: {
    estimatedCitations: number; // Estimated times content was cited by AI
    citationSources: string[]; // Platforms where citations likely occurred
    authorityScore: number; // 0-100 authority score for AI engines
  };
  
  // Content Authority Metrics
  contentAuthority: {
    expertiseSignals: number; // Content demonstrating expertise
    localKnowledgeSignals: number; // Content showing local knowledge
    marketInsightSignals: number; // Content showing market expertise
  };
  
  // Search Engine Optimization
  seoPerformance: {
    organicVisibility: number; // Estimated organic search visibility
    keywordRankings: KeywordRanking[]; // Rankings for target keywords
    backlinkAcquisition: number; // Links earned through content authority
  };
}

interface LeadGenerationMetrics {
  // Lead Quantity and Quality
  leadsGenerated: {
    totalLeads: number;
    qualifiedLeads: number;
    leadQualityScore: number; // Average quality score
  };
  
  // Conversion Funnel
  conversionFunnel: {
    socialMediaEngagement: number; // Total engagement
    profileVisits: number; // Visits to Island Properties
    inquiries: number; // Direct inquiries
    qualifiedInquiries: number; // Qualified property inquiries
    conversions: number; // Actual sales/contracts
  };
  
  // Attribution and ROI
  attribution: {
    firstTouchAttribution: number; // Leads attributed to first touch
    lastTouchAttribution: number; // Leads attributed to last touch
    multiTouchAttribution: number; // Multi-touch attribution value
  };
  
  // Lead Source Analysis
  leadSources: {
    contentDriven: number; // Leads from content
    engagementDriven: number; // Leads from direct engagement
    referralDriven: number; // Leads from referrals
  };
}

interface ROIMetrics {
  // Cost Analysis
  costs: {
    proxyServiceCost: number; // Monthly proxy costs
    timeInvestment: number; // Hours spent on manual posting
    toolingCosts: number; // Software/tool costs
  };
  
  // Revenue Attribution
  revenue: {
    attributedRevenue: number; // Revenue attributed to persona
    pipelineValue: number; // Value of current pipeline
    averageDealValue: number; // Average deal size from persona leads
  };
  
  // ROI Calculation
  roi: {
    monthlyROI: number; // Monthly return on investment
    cumulativeROI: number; // Total ROI since persona creation
    costPerLead: number; // Cost to acquire each lead
    costPerConversion: number; // Cost per actual conversion
  };
}
```

This comprehensive persona schema provides the foundation for creating authentic, GEO-optimized Filipino personas specifically designed for Island Properties lead generation while maintaining security through manual posting workflows and proper encryption.