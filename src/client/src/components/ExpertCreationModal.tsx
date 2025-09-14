import { useState } from 'react';
import { ExpertPersonaFormData, ExpertiseFocus, AuthorityLevel } from '../types/expert';

interface ExpertCreationModalProps {
  onClose: () => void;
  onCreateExpert: (expertData: ExpertPersonaFormData) => Promise<void>;
  editMode?: boolean;
  initialData?: any;
}

export function ExpertCreationModal({ onClose, onCreateExpert, editMode = false, initialData }: ExpertCreationModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getInitialFormData = (): ExpertPersonaFormData => {
    const defaultData = {
      expertName: '',
      expertiseFocus: 'Manila Urban Property Expert' as ExpertiseFocus,
      targetBuyerSegments: [],
      authorityLevel: 'emerging' as AuthorityLevel,
      primaryMarketLocation: '',
      secondaryMarketAreas: [],
      professionalBackground: '',
      expertiseCredentials: '',
      marketExperience: '',
      geoContentSpecializations: [],
      authorityBuildingTopics: [],
      citationWorthyExpertise: [],
      platformExpertiseFocus: {
        medium: { active: false, contentTypes: [] },
        reddit: { active: false, subreddits: [] },
        quora: { active: false, topics: [] },
      },
      contentPublicationSchedule: {
        frequency: 'weekly' as const,
        timezone: 'Asia/Manila',
      },
      expertVoiceCharacteristics: {
        tone: 'professional' as const,
        expertise_level: 'intermediate' as const,
        target_audience: 'all' as const,
      },
      browserFingerprintConfig: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        viewport: {
          width: 1920,
          height: 1080,
        },
      },
    };

    if (editMode && initialData) {
      return {
        ...defaultData,
        expertName: initialData.expertName || '',
        expertiseFocus: initialData.expertiseFocus || defaultData.expertiseFocus,
        targetBuyerSegments: initialData.targetBuyerSegments || [],
        authorityLevel: initialData.authorityLevel || defaultData.authorityLevel,
        primaryMarketLocation: initialData.primaryMarketLocation || '',
        secondaryMarketAreas: initialData.secondaryMarketAreas || [],
        professionalBackground: initialData.professionalBackground || '',
        expertiseCredentials: initialData.expertiseCredentials || '',
        marketExperience: initialData.marketExperience || '',
        geoContentSpecializations: initialData.geoContentSpecializations || [],
        authorityBuildingTopics: initialData.authorityBuildingTopics || [],
        citationWorthyExpertise: initialData.citationWorthyExpertise || [],
        platformExpertiseFocus: initialData.platformExpertiseFocus || defaultData.platformExpertiseFocus,
        contentPublicationSchedule: initialData.contentPublicationSchedule || defaultData.contentPublicationSchedule,
        expertVoiceCharacteristics: initialData.expertVoiceCharacteristics || defaultData.expertVoiceCharacteristics,
        browserFingerprintConfig: initialData.browserFingerprintConfig || defaultData.browserFingerprintConfig,
      };
    }

    return defaultData;
  };

  const [formData, setFormData] = useState<ExpertPersonaFormData>(getInitialFormData());

  const expertiseFocusOptions: ExpertiseFocus[] = [
    'Manila Urban Property Expert',
    'Cebu Island Lifestyle Expert',
    'Investment ROI Analysis Expert',
    'Expat Property Guidance Expert',
    'Philippines Market Analysis Expert',
  ];

  const authorityLevelOptions: AuthorityLevel[] = [
    'emerging',
    'established',
    'recognized',
    'thought-leader',
  ];

  const marketLocations = [
    'Manila', 'Cebu', 'Davao', 'Makati', 'Bonifacio Global City',
    'Quezon City', 'Iloilo', 'Baguio', 'Palawan', 'Boracay',
  ];

  const buyerSegmentOptions = [
    'First-time homebuyers',
    'Real estate investors',
    'Overseas Filipino Workers (OFWs)',
    'Foreign expatriates',
    'Luxury property buyers',
    'Commercial investors',
    'Retirement home seekers',
    'Young professionals',
    'Growing families',
    'Business entrepreneurs',
  ];

  const contentSpecializations = [
    'Market analysis and trends',
    'Property investment strategies',
    'Legal compliance and documentation',
    'Financing and mortgage guidance',
    'Property management insights',
    'Location-specific expertise',
    'Luxury property insights',
    'Commercial real estate',
    'Rental market analysis',
    'Property development trends',
  ];

  function updateFormData<K extends keyof ExpertPersonaFormData>(
    key: K,
    value: ExpertPersonaFormData[K]
  ) {
    setFormData(prev => ({ ...prev, [key]: value }));
  }

  function toggleArrayValue<T>(array: T[], value: T): T[] {
    return array.includes(value)
      ? array.filter(item => item !== value)
      : [...array, value];
  }

  const handleSubmit = async () => {
    setCreating(true);
    setError(null);

    try {
      await onCreateExpert(formData);
    } catch (err) {
      console.error('Error creating expert:', err);
      setError(err instanceof Error ? err.message : 'Failed to create expert');
    } finally {
      setCreating(false);
    }
  };

  const nextStep = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1:
        return formData.expertName.trim() !== '' && 
               formData.primaryMarketLocation.trim() !== '';
      case 2:
        return formData.targetBuyerSegments.length > 0 &&
               formData.geoContentSpecializations.length > 0;
      case 3:
        return formData.professionalBackground.trim() !== '' &&
               formData.expertiseCredentials.trim() !== '';
      case 4:
        return true; // Platform configuration is optional
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{editMode ? 'Edit Expert Persona' : 'Create Expert Persona'}</h2>
            <div className="flex items-center gap-2 mt-2">
              {[1, 2, 3, 4].map(step => (
                <div
                  key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                    step <= currentStep
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {step}
                </div>
              ))}
              <span className="text-sm text-gray-500 ml-2">
                Step {currentStep} of 4
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Step 1: Basic Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expert Name *
                </label>
                <input
                  type="text"
                  value={formData.expertName}
                  onChange={(e) => updateFormData('expertName', e.target.value)}
                  placeholder="e.g., Maria Santos"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Specialization *
                </label>
                <select
                  value={formData.expertiseFocus}
                  onChange={(e) => updateFormData('expertiseFocus', e.target.value as ExpertiseFocus)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {expertiseFocusOptions.map(option => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authority Level *
                </label>
                <select
                  value={formData.authorityLevel}
                  onChange={(e) => updateFormData('authorityLevel', e.target.value as AuthorityLevel)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {authorityLevelOptions.map(level => (
                    <option key={level} value={level}>
                      {level.charAt(0).toUpperCase() + level.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Primary Market Location *
                </label>
                <select
                  value={formData.primaryMarketLocation}
                  onChange={(e) => updateFormData('primaryMarketLocation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select primary market</option>
                  {marketLocations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Secondary Markets (Optional)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {marketLocations
                    .filter(location => location !== formData.primaryMarketLocation)
                    .map(location => (
                    <label key={location} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.secondaryMarketAreas.includes(location)}
                        onChange={() => updateFormData(
                          'secondaryMarketAreas',
                          toggleArrayValue(formData.secondaryMarketAreas, location)
                        )}
                        className="mr-2"
                      />
                      <span className="text-sm">{location}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target Audience & Content Focus */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Target Audience & Content Focus</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Target Buyer Segments * (Select all that apply)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {buyerSegmentOptions.map(segment => (
                    <label key={segment} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.targetBuyerSegments.includes(segment)}
                        onChange={() => updateFormData(
                          'targetBuyerSegments',
                          toggleArrayValue(formData.targetBuyerSegments, segment)
                        )}
                        className="mr-2"
                      />
                      <span className="text-sm">{segment}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Content Specializations * (Select areas of expertise)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {contentSpecializations.map(spec => (
                    <label key={spec} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.geoContentSpecializations.includes(spec)}
                        onChange={() => updateFormData(
                          'geoContentSpecializations',
                          toggleArrayValue(formData.geoContentSpecializations, spec)
                        )}
                        className="mr-2"
                      />
                      <span className="text-sm">{spec}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Authority Building Topics (Optional)
                </label>
                <textarea
                  value={formData.authorityBuildingTopics.join('\n')}
                  onChange={(e) => updateFormData(
                    'authorityBuildingTopics',
                    e.target.value.split('\n').filter(topic => topic.trim())
                  )}
                  placeholder="Enter topics, one per line..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}

          {/* Step 3: Professional Profile */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Professional Profile</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Background *
                </label>
                <textarea
                  value={formData.professionalBackground}
                  onChange={(e) => updateFormData('professionalBackground', e.target.value)}
                  placeholder="Describe professional background in Philippines real estate..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expertise Credentials *
                </label>
                <textarea
                  value={formData.expertiseCredentials}
                  onChange={(e) => updateFormData('expertiseCredentials', e.target.value)}
                  placeholder="List certifications, licenses, awards, etc..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Market Experience (Optional)
                </label>
                <textarea
                  value={formData.marketExperience}
                  onChange={(e) => updateFormData('marketExperience', e.target.value)}
                  placeholder="Describe specific market experience and notable achievements..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expert Voice Characteristics
                </label>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Tone</label>
                    <select
                      value={formData.expertVoiceCharacteristics.tone}
                      onChange={(e) => updateFormData('expertVoiceCharacteristics', {
                        ...formData.expertVoiceCharacteristics,
                        tone: e.target.value as any
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="authoritative">Authoritative</option>
                      <option value="approachable">Approachable</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Expertise Level</label>
                    <select
                      value={formData.expertVoiceCharacteristics.expertise_level}
                      onChange={(e) => updateFormData('expertVoiceCharacteristics', {
                        ...formData.expertVoiceCharacteristics,
                        expertise_level: e.target.value as any
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="beginner-friendly">Beginner-friendly</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                      <option value="expert-only">Expert-only</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Target Audience</label>
                    <select
                      value={formData.expertVoiceCharacteristics.target_audience}
                      onChange={(e) => updateFormData('expertVoiceCharacteristics', {
                        ...formData.expertVoiceCharacteristics,
                        target_audience: e.target.value as any
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="first-time-buyers">First-time Buyers</option>
                      <option value="investors">Investors</option>
                      <option value="expats">Expats</option>
                      <option value="locals">Locals</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Platform Configuration */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Platform Configuration</h3>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Publication Schedule
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Frequency</label>
                    <select
                      value={formData.contentPublicationSchedule.frequency}
                      onChange={(e) => updateFormData('contentPublicationSchedule', {
                        ...formData.contentPublicationSchedule,
                        frequency: e.target.value as any
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Timezone</label>
                    <input
                      type="text"
                      value={formData.contentPublicationSchedule.timezone}
                      onChange={(e) => updateFormData('contentPublicationSchedule', {
                        ...formData.contentPublicationSchedule,
                        timezone: e.target.value
                      })}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Platform Focus (Optional)</h4>
                
                {/* Medium */}
                <div className="border border-gray-200 rounded p-3">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={formData.platformExpertiseFocus.medium?.active || false}
                      onChange={(e) => updateFormData('platformExpertiseFocus', {
                        ...formData.platformExpertiseFocus,
                        medium: {
                          active: e.target.checked,
                          contentTypes: formData.platformExpertiseFocus.medium?.contentTypes || []
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="font-medium">Medium</span>
                  </label>
                  {formData.platformExpertiseFocus.medium?.active && (
                    <div className="ml-6">
                      <p className="text-sm text-gray-600 mb-1">Content Types:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Articles', 'Market Reports', 'Investment Guides', 'Opinion Pieces'].map(type => (
                          <label key={type} className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={formData.platformExpertiseFocus.medium?.contentTypes.includes(type) || false}
                              onChange={(e) => {
                                const currentTypes = formData.platformExpertiseFocus.medium?.contentTypes || [];
                                const newTypes = e.target.checked
                                  ? [...currentTypes, type]
                                  : currentTypes.filter(t => t !== type);
                                updateFormData('platformExpertiseFocus', {
                                  ...formData.platformExpertiseFocus,
                                  medium: {
                                    active: true,
                                    contentTypes: newTypes
                                  }
                                });
                              }}
                              className="mr-1"
                            />
                            {type}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Reddit */}
                <div className="border border-gray-200 rounded p-3">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={formData.platformExpertiseFocus.reddit?.active || false}
                      onChange={(e) => updateFormData('platformExpertiseFocus', {
                        ...formData.platformExpertiseFocus,
                        reddit: {
                          active: e.target.checked,
                          subreddits: formData.platformExpertiseFocus.reddit?.subreddits || []
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="font-medium">Reddit</span>
                  </label>
                  {formData.platformExpertiseFocus.reddit?.active && (
                    <div className="ml-6">
                      <p className="text-sm text-gray-600 mb-1">Target Subreddits:</p>
                      <div className="flex flex-wrap gap-2">
                        {['r/Philippines', 'r/RealEstate', 'r/investing', 'r/expatFIRE'].map(sub => (
                          <label key={sub} className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={formData.platformExpertiseFocus.reddit?.subreddits.includes(sub) || false}
                              onChange={(e) => {
                                const currentSubs = formData.platformExpertiseFocus.reddit?.subreddits || [];
                                const newSubs = e.target.checked
                                  ? [...currentSubs, sub]
                                  : currentSubs.filter(s => s !== sub);
                                updateFormData('platformExpertiseFocus', {
                                  ...formData.platformExpertiseFocus,
                                  reddit: {
                                    active: true,
                                    subreddits: newSubs
                                  }
                                });
                              }}
                              className="mr-1"
                            />
                            {sub}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Quora */}
                <div className="border border-gray-200 rounded p-3">
                  <label className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      checked={formData.platformExpertiseFocus.quora?.active || false}
                      onChange={(e) => updateFormData('platformExpertiseFocus', {
                        ...formData.platformExpertiseFocus,
                        quora: {
                          active: e.target.checked,
                          topics: formData.platformExpertiseFocus.quora?.topics || []
                        }
                      })}
                      className="mr-2"
                    />
                    <span className="font-medium">Quora</span>
                  </label>
                  {formData.platformExpertiseFocus.quora?.active && (
                    <div className="ml-6">
                      <p className="text-sm text-gray-600 mb-1">Target Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {['Real Estate', 'Philippines', 'Investment', 'Property Management'].map(topic => (
                          <label key={topic} className="flex items-center text-sm">
                            <input
                              type="checkbox"
                              checked={formData.platformExpertiseFocus.quora?.topics.includes(topic) || false}
                              onChange={(e) => {
                                const currentTopics = formData.platformExpertiseFocus.quora?.topics || [];
                                const newTopics = e.target.checked
                                  ? [...currentTopics, topic]
                                  : currentTopics.filter(t => t !== topic);
                                updateFormData('platformExpertiseFocus', {
                                  ...formData.platformExpertiseFocus,
                                  quora: {
                                    active: true,
                                    topics: newTopics
                                  }
                                });
                              }}
                              className="mr-1"
                            />
                            {topic}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 pb-4">
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              {currentStep === 1 && 'Basic expert information and location'}
              {currentStep === 2 && 'Define target audience and content areas'}
              {currentStep === 3 && 'Professional background and credentials'}
              {currentStep === 4 && 'Platform configuration and publishing schedule'}
            </div>
            
            <div className="flex gap-3">
              {currentStep > 1 && (
                <button
                  onClick={prevStep}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Previous
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  onClick={nextStep}
                  disabled={!isStepValid(currentStep)}
                  className={`px-4 py-2 rounded ${
                    isStepValid(currentStep)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={creating || !isStepValid(currentStep)}
                  className={`px-6 py-2 rounded ${
                    !creating && isStepValid(currentStep)
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {creating ? (editMode ? 'Updating...' : 'Creating...') : (editMode ? 'Update Expert' : 'Create Expert')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}