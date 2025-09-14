    # Expert Persona Schema - Island Properties GEO Lead Generation Character Definition System

## Core Expert Persona Structure

### Expert Persona Entity Definition

```typescript
interface PhilippinesRealEstateExpert {
  // Expert Identity
  id: string; // UUID
  expertName: string; // Professional name (e.g., "Maria Santos")
  expertStatus: ExpertStatus;
  
  // Professional Authority Profile
  expertiseSpecialization: RealEstateExpertise;
  professionalCredentials: ProfessionalBackground;
  authorityLevel: AuthorityLevel;
  
  // Philippines Real Estate Specialization
  marketSpecialization: PhilippinesMarketExpertise;
  buyerSegmentExpertise: BuyerSegmentSpecialization;
  
  // Geographic Authority (Philippines Focus)
  primaryMarketLocation: PhilippinesMarketLocation;
  localMarketKnowledge: LocalMarketExpertise;
  
  // GEO Content Authority Strategy
  geoContentSpecialization: GEOContentExpertise;
  authorityBuildingStrategy: AuthorityBuildingStrategy;
  
  // Platform Authority Distribution
  platformExpertise: PlatformExpertiseStrategy;
  
  // Lead Generation Through Expertise
  expertLeadGenerationConfig: ExpertLeadGenerationConfig;
  
  // Security Configuration
  encryptionKeyId: string; // Separate encryption key per expert
  proxyConfiguration: ProxyAssignment;
  
  // Authority Performance Tracking
  authorityMetrics: ExpertAuthorityMetrics;
  leadConversionTracking: ExpertLeadConversionMetrics;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastExpertActivity: Date;
}
```

### Expert Status Types

```typescript
type ExpertStatus = 
  | 'developing'     // Building expertise foundation and credentials
  | 'active'         // Actively publishing authority content
  | 'established'    // Recognized expert with consistent authority
  | 'thought_leader' // Industry thought leader with significant influence
  | 'suspended';     // Temporarily disabled due to issues
```

## Philippines Real Estate Expertise Specialization

### Target Market Expertise Areas

```typescript
type RealEstateExpertise = 
  | 'philippines_market_analysis'      // Overall market trends and analysis
  | 'expat_property_guidance'          // Specializing in foreign buyer needs
  | 'ofw_investment_advisory'          // OFW investment strategies and guidance
  | 'manila_urban_property_expert'     // Manila metropolitan area expertise
  | 'cebu_island_lifestyle_expert'     // Cebu and island living specialization
  | 'luxury_property_consultant'       // High-end property market expertise
  | 'investment_roi_analyst'           // Property investment analysis and ROI
  | 'legal_compliance_advisor'         // Philippines property law and compliance
  | 'emerging_markets_specialist';     // Emerging areas and development trends

interface ExpertiseSpecializationConfig {
  primaryExpertise: RealEstateExpertise;
  
  // Authority Building Configuration
  expertiseDepth: ExpertiseDepth;
  credibilityMarkers: CredibilityMarker[];
  authoritySignals: AuthoritySignal[];
  
  // Content Strategy Alignment
  authorityContentFocus: AuthorityContentArea[];
  expertPositioningApproach: ExpertPositioningStrategy;
  thoughtLeadershipGoals: ThoughtLeadershipGoal[];
}

type ExpertiseDepth = 
  | 'emerging_expert'    // 1-3 years experience, building credibility
  | 'established_expert' // 3-7 years experience, recognized authority
  | 'senior_expert'      // 7-15 years experience, thought leadership
  | 'industry_authority'; // 15+ years experience, industry influence

type AuthorityContentArea = 
  | 'comprehensive_market_analysis'     // Deep market reports and analysis
  | 'investment_education_content'      // Educational content for investors
  | 'legal_regulatory_guidance'         // Legal and regulatory expertise
  | 'local_market_insights'            // Local knowledge and insider insights
  | 'buyer_consultation_expertise'      // Direct buyer guidance and support
  | 'trend_prediction_analysis'        // Market trend analysis and predictions
  | 'case_study_development'           // Real-world case studies and examples;

interface CredibilityMarker {
  type: 'professional_experience' | 'market_track_record' | 'client_testimonials' | 'industry_recognition';
  description: string;
  verificationMethod: string;
  authorityValue: number; // 1-10 scale of credibility impact
}
```

## Buyer Segment Specialization for Expert Authority

### Expert Positioning by Buyer Persona

```typescript
interface BuyerSegmentSpecialization {
  primaryBuyerSegment: PhilippinesBuyerSegment;
  expertisePositioning: ExpertPositioningStrategy;
  authorityBuildingApproach: AuthorityBuildingApproach;
  leadGenerationStrategy: ExpertLeadGenerationStrategy;
}

type PhilippinesBuyerSegment = 
  | 'expat_retirees'           // Foreign retirees seeking Philippines property
  | 'ofw_investors'            // Overseas Filipino Workers investing back home
  | 'manila_professionals'     // Urban professionals seeking investment/lifestyle
  | 'international_investors'  // Foreign investors seeking ROI opportunities
  | 'lifestyle_relocators'     // People seeking lifestyle change to Philippines
  | 'business_expansion_buyers'// Business owners expanding to Philippines
  | 'digital_nomad_investors'; // Location-independent professionals

interface ExpertPositioningStrategy {
  expertiseAngle: string; // How to position expertise for this buyer segment
  authorityDemonstration: string[]; // Ways to demonstrate relevant expertise
  trustBuildingApproach: string; // How to build trust with this segment
  consultationPositioning: string; // How to position consultation services
}

// Example expert positioning configurations
const expertPositioningExamples: Record<PhilippinesBuyerSegment, ExpertPositioningStrategy> = {
  expat_retirees: {
    expertiseAngle: 'Philippines retirement property specialist with 8+ years helping foreign retirees',
    authorityDemonstration: [
      'Comprehensive guides to Philippines retirement visas and property ownership',
      'Case studies of successful expat property purchases',
      'Legal compliance expertise for foreign buyers',
      'Cost of living analysis and lifestyle insights'
    ],
    trustBuildingApproach: 'Share personal experience helping hundreds of retirees navigate Philippines property market',
    consultationPositioning: 'Personalized retirement property consultation based on visa status and lifestyle goals'
  },
  
  ofw_investors: {
    expertiseAngle: 'OFW property investment specialist understanding the unique challenges of overseas earning',
    authorityDemonstration: [
      'Investment ROI analysis specifically for OFW income patterns',
      'Remote property management guidance for overseas investors',
      'Currency exchange and financing strategies for OFWs',
      'Family property planning and inheritance considerations'
    ],
    trustBuildingApproach: 'Deep understanding of OFW financial situations and long-distance investment challenges',
    consultationPositioning: 'Strategic investment consultation for OFWs maximizing overseas earnings through property'
  },
  
  manila_professionals: {
    expertiseAngle: 'Manila property market expert specializing in professional lifestyle and investment transitions',
    authorityDemonstration: [
      'Manila vs. provincial property investment analysis',
      'Professional lifestyle transition planning',
      'Urban to island living feasibility studies',
      'Career-property investment integration strategies'
    ],
    trustBuildingApproach: 'Personal experience with Manila professional market and lifestyle transition decisions',
    consultationPositioning: 'Strategic property consultation for professionals optimizing lifestyle and investment goals'
  }
};
```

## GEO Content Authority Strategy

### AI Citation-Optimized Content Framework

```typescript
interface GEOContentExpertise {
  // Primary Authority Content (70-80% of content) - AI Citation Focus
  primaryAuthorityContent: AuthorityContentDefinition[];
  
  // Secondary Expertise Content (15-20% of content) - Credibility Building
  secondaryExpertiseContent: ExpertiseContentDefinition[];
  
  // Consultation Conversion Content (5-10% of content) - Lead Generation
  consultationConversionContent: ConversionContentDefinition[];
  
  // Content Types Optimized for AI Engine Citation
  aiOptimizedContentTypes: AIContentType[];
  
  // Seasonal/Market Cycle Content (Philippines Context)
  marketCycleContent: PhilippinesMarketCycleContent[];
}

interface AuthorityContentDefinition {
  contentType: string;
  description: string;
  
  // AI Engine Citation Optimization
  aiCitationKeywords: string[]; // Keywords AI engines associate with authority
  comprehensiveAnswerSets: ComprehensiveAnswerSet[]; // Complete answers to complex queries
  authoritySignalElements: AuthoritySignalElement[]; // Elements that build AI citation credibility
  
  // Content Depth and Quality
  contentDepthRequirements: ContentDepthRequirement;
  researchRequirements: ResearchRequirement[];
  expertiseValidationElements: ExpertiseValidationElement[];
  
  // Lead Generation Integration
  buyerSegmentRelevance: PhilippinesBuyerSegment[];
  consultationConversionPotential: 'high' | 'medium' | 'low';
  expertPositioningStage: 'authority_building' | 'trust_development' | 'consultation_invitation';
}

// Authority-Building Content Types for AI Citation
type AIContentType = 
  | 'comprehensive_philippines_property_guides'    // Complete guides AI engines cite as definitive
  | 'expert_market_analysis_reports'               // Data-driven analysis AI engines reference
  | 'legal_compliance_expert_explanations'         // Authoritative legal guidance AI engines trust
  | 'investment_strategy_expert_frameworks'        // Investment frameworks AI engines recommend
  | 'local_market_authority_insights'             // Local expertise AI engines can't get elsewhere
  | 'buyer_education_expert_content'              // Educational content AI engines use for guidance
  | 'trend_analysis_expert_predictions'           // Expert predictions AI engines reference for trends
  | 'case_study_expert_analysis';                 // Real-world analysis AI engines use for examples

interface ComprehensiveAnswerSet {
  expertQuery: string; // Complex query requiring expert knowledge
  authorityAnswerFramework: string[]; // Framework for comprehensive expert response
  expertiseValidationElements: string[]; // How to demonstrate expertise in answer
  citationWorthy: boolean; // Whether this is likely to be cited by AI engines
}

// Example GEO-Optimized Expert Content Sets
const geoExpertContentSets: ComprehensiveAnswerSet[] = [
  {
    expertQuery: "What are the complete legal requirements for foreigners buying property in Philippines?",
    authorityAnswerFramework: [
      "Constitutional restrictions and foreign ownership limitations",
      "Condominium foreign ownership rules and 60/40 restrictions", 
      "Long-term lease alternatives and legal structures",
      "Required documentation and legal processes",
      "Common legal pitfalls and how to avoid them",
      "Professional legal representation requirements"
    ],
    expertiseValidationElements: [
      "Cite specific Philippine laws and regulations",
      "Reference real case studies from legal experience",
      "Include recent legal updates and changes",
      "Provide step-by-step legal compliance process"
    ],
    citationWorthy: true
  },
  {
    expertQuery: "How do Philippines property investment returns compare to other Southeast Asian markets?",
    authorityAnswerFramework: [
      "Philippines property market ROI analysis with current data",
      "Comparative analysis with Thailand, Malaysia, Vietnam markets",
      "Risk-adjusted returns and market stability factors",
      "Currency considerations and exchange rate impacts",
      "Tax implications and total cost of ownership",
      "Expert predictions for 5-year market outlook"
    ],
    expertiseValidationElements: [
      "Current market data with reliable sources",
      "Personal experience with multiple Southeast Asian markets",
      "Professional network insights and validation",
      "Track record of successful investment guidance"
    ],
    citationWorthy: true
  },
  {
    expertQuery: "What should expat retirees know about living costs and property expenses in Cebu?",
    authorityAnswerFramework: [
      "Complete cost of living breakdown for Cebu retirees",
      "Property costs: purchase, maintenance, taxes, utilities",
      "Healthcare costs and insurance considerations",
      "Transportation and daily living expenses",
      "Lifestyle cost variations by area and lifestyle choices",
      "Budget planning framework for sustainable retirement"
    ],
    expertiseValidationElements: [
      "Current, verified cost data from local sources",
      "Personal experience with expat retiree clients",
      "Network of local service providers and cost validation",
      "Case studies of successful retiree transitions"
    ],
    citationWorthy: true
  }
];

interface AuthoritySignalElement {
  signalType: 'local_expertise' | 'market_data_access' | 'professional_experience' | 'client_success_stories';
  implementation: string; // How to demonstrate this authority signal
  aiCitationValue: string; // Why AI engines would cite this authority
  credibilityImpact: number; // 1-10 scale of credibility impact
}
```

## Platform Authority Strategy

### GEO Platform-Specific Expert Positioning

```typescript
interface PlatformExpertiseStrategy {
  medium: MediumExpertStrategy; // Phase 1 - Primary authority building platform
  reddit: RedditExpertStrategy; // Phase 2 - Community expert positioning  
  quora: QuoraExpertStrategy; // Phase 3 - Q&A expert authority
  facebook: FacebookExpertStrategy; // Phase 4 - Local community expert presence
  linkedin: LinkedInExpertStrategy; // Phase 5 - Professional expert networking
}

interface MediumExpertStrategy {
  // Medium-Specific Expert Authority Building
  expertPositioning: 'philippines_real_estate_market_expert';
  
  contentStrategy: {
    comprehensiveMarketAnalysis: number; // % comprehensive market analysis articles
    expertInvestmentGuidance: number; // % investment strategy and guidance
    legalRegulatoryExpertise: number; // % legal and regulatory expert content
    localMarketInsights: number; // % local market expertise demonstration
    buyerEducationContent: number; // % educational content for buyers
  };
  
  // Authority Building Approach
  expertiseEstablishmentMethod: 'comprehensive_authoritative_articles';
  publicationFrequency: 'weekly_comprehensive_analysis';
  expertBylineStrategy: 'credentials_experience_local_knowledge';
  
  // Medium-Specific Authority Features
  mediumPublicationStrategy: MediumPublicationStrategy;
  expertNetworkingApproach: MediumNetworkingStrategy;
  authorityMeasurementMetrics: MediumAuthorityMetrics;
  
  // Lead Generation Through Authority
  expertiseToConsultationFunnel: ExpertiseConsultationFunnel;
  authorityBasedLeadGeneration: AuthorityLeadGeneration;
}

interface MediumPublicationStrategy {
  targetPublications: string[]; // Philippines real estate and investment publications
  expertContributorStatus: 'individual' | 'publication_contributor' | 'featured_expert';
  crossPromotionStrategy: string; // How to leverage publication network
  authorityAmplificationMethod: string; // How to amplify expert status
}

interface RedditExpertStrategy {
  // Reddit-Specific Expert Community Positioning
  expertPositioning: 'helpful_philippines_property_expert';
  
  communityExpertiseStrategy: {
    philippines_subreddit_expertise: number; // % expertise demonstration in r/Philippines
    real_estate_subreddit_authority: number; // % expert contributions in r/RealEstate  
    expat_community_guidance: number; // % helpful expert guidance in expat communities
    investment_subreddit_insights: number; // % investment expertise in relevant communities
  };
  
  // Expert Engagement Approach
  expertEngagementMethod: 'comprehensive_helpful_expert_responses';
  authorityBuildingFrequency: 'daily_expert_value_contributions';
  expertCredibilityEstablishment: 'consistent_high_value_expert_advice';
  
  // Reddit-Specific Expert Features
  redditExpertReputationBuilding: RedditExpertReputationStrategy;
  communityValueCreation: CommunityValueStrategy;
  expertRecognitionPursuits: ExpertRecognitionStrategy;
  
  // Lead Generation Through Community Expertise
  communityExpertiseToInquiry: CommunityExpertiseConversion;
  helpfulExpertToConsultation: HelpfulExpertConversion;
}

interface QuoraExpertStrategy {
  // Quora-Specific Expert Answer Authority
  expertPositioning: 'definitive_philippines_property_expert';
  
  expertAnswerStrategy: {
    comprehensiveExpertAnswers: number; // % comprehensive authoritative answers
    marketAnalysisExpertise: number; // % market analysis expert responses
    legalGuidanceAuthority: number; // % legal guidance expert answers
    investmentStrategyExpertise: number; // % investment strategy expert content
    localKnowledgeAuthority: number; // % local expertise demonstration
  };
  
  // Expert Answer Approach  
  answerAuthorityMethod: 'comprehensive_data_backed_expert_responses';
  expertCredentialsDisplay: 'prominent_expertise_credentials';
  authorityAnswerFrequency: 'daily_expert_question_responses';
  
  // Quora-Specific Expert Features
  quoraExpertStatusPursuit: QuoraExpertStatusStrategy;
  answerQualityOptimization: AnswerQualityStrategy;
  expertFollowerBuilding: ExpertFollowerStrategy;
  
  // Lead Generation Through Expert Answers
  expertAnswerToConsultation: ExpertAnswerConversion;
  authorityBasedInquiries: AuthorityInquiryGeneration;
}
```

## Expert Lead Generation Configuration

### Authority-Based Lead Generation Strategy

```typescript
interface ExpertLeadGenerationConfig {
  // Expert Authority Lead Capture Strategy
  authorityLeadCaptureStrategy: AuthorityBasedLeadCapture;
  
  // Expert Consultation Funnel
  consultationFunnelStrategy: ExpertConsultationFunnel;
  
  // Lead Qualification Through Expertise
  expertLeadQualification: ExpertLeadQualificationStrategy;
  
  // ROI Measurement for Expert Authority
  expertAuthorityROI: ExpertAuthorityROIStrategy;
}

interface AuthorityBasedLeadCapture {
  // Authority-Driven Lead Generation Methods
  expertContentBasedCapture: ExpertContentLeadCapture[];
  authorityEngagementCapture: AuthorityEngagementCapture[];
  consultationRequestHandling: ConsultationRequestStrategy;
  
  // Expert Lead Qualification Process
  authorityBasedQualification: AuthorityLeadQualificationCriteria;
  expertConsultationScoring: ExpertConsultationScoringSystem;
}

interface ExpertContentLeadCapture {
  expertContentType: string; // Type of expert content generating leads
  leadCaptureMethod: 'consultation_inquiry' | 'expert_question_response' | 'authority_validation_request' | 'direct_expert_contact';
  expertQualificationQuestions: string[]; // Questions to qualify expertise match
  consultationInvitationApproach: string; // How to invite consultation
}

interface ExpertConsultationFunnel {
  // Consultation Request Processing
  consultationRequestTypes: ConsultationRequestType[];
  expertConsultationDelivery: ConsultationDeliveryMethod[];
  consultationToIslandPropertiesReferral: ReferralStrategy;
  
  // Consultation Quality and Conversion
  consultationQualityStandards: ConsultationQualityStandard[];
  consultationConversionOptimization: ConversionOptimizationStrategy[];
}

interface ConsultationRequestType {
  requestType: 'general_market_guidance' | 'specific_property_analysis' | 'investment_strategy_consultation' | 'legal_compliance_guidance';
  expertiseRequirement: RealEstateExpertise; // Which expertise area this requires
  consultationComplexity: 'basic' | 'intermediate' | 'advanced';
  leadConversionPotential: 'high' | 'medium' | 'low';
  islandPropertiesRelevance: string; // How this consultation connects to Island Properties
}

// Example consultation funnel configuration
const expertConsultationFunnelExample: ExpertConsultationFunnel = {
  consultationRequestTypes: [
    {
      requestType: 'specific_property_analysis',
      expertiseRequirement: 'cebu_island_lifestyle_expert',
      consultationComplexity: 'intermediate',
      leadConversionPotential: 'high',
      islandPropertiesRelevance: 'Direct match for Island Properties target properties'
    },
    {
      requestType: 'investment_strategy_consultation', 
      expertiseRequirement: 'investment_roi_analyst',
      consultationComplexity: 'advanced',
      leadConversionPotential: 'high',
      islandPropertiesRelevance: 'Strategic consultation can identify Island Properties opportunities'
    }
  ],
  
  expertConsultationDelivery: [
    {
      deliveryMethod: 'comprehensive_written_analysis',
      timeInvestment: '2-3 hours expert analysis',
      valueProposition: 'Detailed market analysis and recommendations',
      leadNurturingValue: 'Demonstrates deep expertise and builds trust'
    },
    {
      deliveryMethod: 'video_consultation_session',
      timeInvestment: '60-90 minute expert consultation', 
      valueProposition: 'Personalized expert guidance and Q&A',
      leadNurturingValue: 'Direct relationship building and trust establishment'
    }
  ],
  
  consultationToIslandPropertiesReferral: {
    referralTiming: 'after_establishing_trust_and_demonstrating_expertise',
    referralApproach: 'natural_recommendation_based_on_consultation_findings',
    referralPositioning: 'island_properties_as_implementation_partner',
    conversionOptimization: 'warm_introduction_with_expert_endorsement'
  }
};
```

## Expert Authority Performance Metrics

### GEO and Expert Authority Tracking

```typescript
interface ExpertAuthorityMetrics {
  // Expert Authority Building Performance
  authorityBuildingMetrics: AuthorityBuildingMetrics;
  
  // Platform-Specific Expert Performance
  platformExpertiseMetrics: {
    [platform: string]: PlatformExpertiseMetrics;
  };
  
  // Expert Lead Generation Performance
  expertLeadGenerationMetrics: ExpertLeadGenerationMetrics;
  
  // AI Citation and Authority Recognition
  aiCitationAuthorityMetrics: AICitationAuthorityMetrics;
  
  // Expert ROI and Business Impact
  expertROIMetrics: ExpertROIMetrics;
}

interface AuthorityBuildingMetrics {
  // Expert Recognition and Credibility
  expertRecognitionSignals: {
    expertStatusBadges: number; // Platform expert recognition badges
    authorityContentShares: number; // Shares by other experts/professionals
    expertMentionsAndReferences: number; // Mentions by industry professionals  
    thoughtLeadershipIndicators: number; // Thought leadership recognition signals
    expertiseValidationEvents: number; // Events where expertise was validated
  };
  
  // Content Authority Performance
  contentAuthorityMetrics: {
    comprehensiveContentPieces: number; // Total comprehensive expert content created
    averageContentDepth: number; // Average word count/depth of expert content
    contentQualityScore: number; // Quality assessment of expert content
    expertiseConsistencyScore: number; // Consistency of expertise demonstration
    authorityContentEngagementQuality: number; // Quality of engagement on expert content
  };
  
  // Expert Market Position
  marketPositionMetrics: {
    expertRankingPosition: number; // Ranking among Philippines real estate experts
    marketShareOfVoice: number; // Share of expert voice in market discussions
    competitiveAuthorityScore: number; // Authority score vs competitors
    expertDifferentiationScore: number; // Uniqueness of expert positioning
  };
}

interface ExpertLeadGenerationMetrics {
  // Expert Authority to Lead Conversion
  authorityLeadConversion: {
    expertInquiriesGenerated: number; // Inquiries generated from expert positioning
    consultationRequestsReceived: number; // Direct consultation requests
    expertAuthorityToLeadRate: number; // Conversion rate from authority to leads
    consultationToQualifiedLeadRate: number; // Consultation to qualified lead rate
    expertLeadQualityScore: number; // Average quality of expert-generated leads
  };
  
  // Consultation Performance
  consultationMetrics: {
    consultationsCompleted: number; // Total expert consultations completed
    consultationSatisfactionScore: number; // Satisfaction with expert consultations
    consultationToReferralRate: number; // Consultations leading to Island Properties referrals
    consultationRevenueAttribution: number; // Revenue attributed to expert consultations
  };
  
  // Lead Source Attribution
  expertLeadSources: {
    mediumArticleLeads: number; // Leads from Medium expert articles
    redditExpertiseLeads: number; // Leads from Reddit expert contributions
    quoraExpertAnswerLeads: number; // Leads from Quora expert answers
    directExpertInquiries: number; // Direct inquiries to expert
    referralNetworkLeads: number; // Leads from expert referral network
  };
}

interface AICitationAuthorityMetrics {
  // AI Engine Citation Estimates
  aiCitationEstimates: {
    estimatedMonthlyCitations: number; // Estimated AI engine citations monthly
    citationQualityScore: number; // Quality/authority of citations received
    aiAuthorityRecognitionScore: number; // Recognition as authority by AI engines
    searchVisibilityImprovementScore: number; // Improvement in search visibility
  };
  
  // Content AI Optimization Performance
  aiOptimizationMetrics: {
    contentAIOptimizationScore: number; // How well content is optimized for AI citation
    comprehensiveAnswerCitationRate: number; // Rate of comprehensive answers being cited
    expertiseValidationCitationRate: number; // Rate of expertise validation in citations
    authoritySignalEffectivenessScore: number; // Effectiveness of authority signals
  };
}

interface ExpertROIMetrics {
  // Expert Authority Investment Analysis
  expertInvestmentMetrics: {
    contentCreationTimeInvestment: number; // Hours invested in expert content creation
    platformAuthoryBuildingInvestment: number; // Time invested in platform authority building
    consultationDeliveryInvestment: number; // Time invested in consultation delivery
    totalExpertPositioningInvestment: number; // Total investment in expert positioning
  };
  
  // Expert Authority Revenue Attribution
  expertRevenueMetrics: {
    expertAttributedRevenue: number; // Revenue attributed to expert positioning
    consultationDrivenRevenue: number; // Revenue from expert consultation funnel
    authorityBrandValueGenerated: number; // Brand value generated through authority
    expertROICalculation: number; // ROI from expert positioning investment
  };
  
  // Competitive Advantage Metrics
  competitiveAdvantageMetrics: {
    expertAuthorityDifferentiation: number; // Differentiation through expert authority
    marketLeadershipPosition: number; // Position as market thought leader
    expertBrandRecognitionValue: number; // Brand recognition value from expertise
    sustainableCompetitiveAdvantage: number; // Long-term competitive advantage score
  };
}
```

This comprehensive expert persona schema provides the foundation for creating authoritative Philippines real estate experts specifically designed for GEO lead generation while maintaining authenticity through professional expertise demonstration and genuine market knowledge.