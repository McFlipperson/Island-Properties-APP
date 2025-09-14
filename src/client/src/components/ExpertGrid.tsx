import { ExpertPersona } from '../types/expert';

interface ExpertGridProps {
  experts: ExpertPersona[];
  onExpertAction: (action: string, expert: ExpertPersona) => void;
  activeSessionId?: string;
}

export function ExpertGrid({ experts, onExpertAction, activeSessionId }: ExpertGridProps) {
  if (experts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No experts match your current filters.</p>
        <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filter criteria.</p>
      </div>
    );
  }

  const getAuthorityLevelColor = (level: string) => {
    switch (level) {
      case 'emerging': return 'bg-yellow-100 text-yellow-800';
      case 'established': return 'bg-blue-100 text-blue-800';
      case 'recognized': return 'bg-green-100 text-green-800';
      case 'thought-leader': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'developing': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-gray-100 text-gray-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {experts.map((expert) => (
        <div
          key={expert.id}
          className={`bg-white rounded-lg border p-6 hover:shadow-lg transition-shadow ${
            activeSessionId === expert.id ? 'ring-2 ring-blue-500 border-blue-200' : 'border-gray-200'
          }`}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {expert.expertName}
              </h3>
              <p className="text-sm text-blue-600 mt-1">
                {expert.expertiseFocus}
              </p>
            </div>
            {activeSessionId === expert.id && (
              <div className="flex items-center gap-1 text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">ACTIVE</span>
              </div>
            )}
          </div>

          {/* Authority & Status */}
          <div className="flex gap-2 mb-4">
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getAuthorityLevelColor(expert.authorityLevel)}`}>
              {expert.authorityLevel.replace('-', ' ')}
            </span>
            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(expert.expertStatus)}`}>
              {expert.expertStatus}
            </span>
          </div>

          {/* Location */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              <span className="font-medium">Primary Market:</span> {expert.primaryMarketLocation}
            </p>
            {expert.secondaryMarketAreas && expert.secondaryMarketAreas.length > 0 && (
              <p className="text-sm text-gray-500 mt-1">
                +{expert.secondaryMarketAreas.length} secondary markets
              </p>
            )}
          </div>

          {/* Metrics */}
          <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {expert.currentAuthorityScore?.toFixed(1) || '0.0'}
              </div>
              <div className="text-xs text-gray-500">Authority Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-gray-900">
                {expert.monthlyConsultationRequests || 0}
              </div>
              <div className="text-xs text-gray-500">Monthly Requests</div>
            </div>
          </div>

          {/* Platform Focus */}
          <div className="mb-4">
            <div className="text-xs text-gray-500 mb-2">Active Platforms:</div>
            <div className="flex flex-wrap gap-1">
              {expert.platformExpertiseFocus.medium?.active && (
                <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">Medium</span>
              )}
              {expert.platformExpertiseFocus.reddit?.active && (
                <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">Reddit</span>
              )}
              {expert.platformExpertiseFocus.quora?.active && (
                <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">Quora</span>
              )}
              {expert.platformExpertiseFocus.facebook?.active && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">Facebook</span>
              )}
              {expert.platformExpertiseFocus.linkedin?.active && (
                <span className="px-2 py-1 text-xs bg-linkedin-100 text-linkedin-700 rounded">LinkedIn</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {activeSessionId !== expert.id ? (
              <button
                onClick={() => onExpertAction('activate', expert)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Activate Session
              </button>
            ) : (
              <button
                disabled
                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded opacity-75 cursor-not-allowed"
              >
                Session Active
              </button>
            )}
            
            <div className="relative">
              <button
                onClick={(e) => {
                  const menu = e.currentTarget.nextElementSibling as HTMLElement;
                  menu.classList.toggle('hidden');
                }}
                className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
              </button>
              
              <div className="hidden absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                <button
                  onClick={() => onExpertAction('edit', expert)}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Edit
                </button>
                <button
                  onClick={() => onExpertAction('delete', expert)}
                  className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}