import { DashboardStats } from '../types/expert';

interface ExpertStatsCardsProps {
  stats: DashboardStats;
}

export function ExpertStatsCards({ stats }: ExpertStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Experts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Total Experts</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalExperts}</p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Experts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Active Experts</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.activeExperts}</p>
            {stats.totalExperts > 0 && (
              <p className="text-xs text-gray-400 mt-1">
                {Math.round((stats.activeExperts / stats.totalExperts) * 100)}% of total
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Active Sessions</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.activeSessions}</p>
            <div className="flex items-center gap-1 mt-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-600">Live</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Consultation Requests */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500">Monthly Requests</p>
            <p className="text-2xl font-semibold text-gray-900">{stats.totalConsultationRequests}</p>
            <p className="text-xs text-gray-400 mt-1">
              Avg Authority: {stats.averageAuthorityScore.toFixed(1)}
            </p>
          </div>
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Authority Levels Breakdown */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 md:col-span-2 lg:col-span-4">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Authority Levels Distribution</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">{stats.authorityLevels.emerging}</div>
            <div className="text-xs text-gray-500">Emerging</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ 
                  width: stats.totalExperts > 0 
                    ? `${(stats.authorityLevels.emerging / stats.totalExperts) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">{stats.authorityLevels.established}</div>
            <div className="text-xs text-gray-500">Established</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ 
                  width: stats.totalExperts > 0 
                    ? `${(stats.authorityLevels.established / stats.totalExperts) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">{stats.authorityLevels.recognized}</div>
            <div className="text-xs text-gray-500">Recognized</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ 
                  width: stats.totalExperts > 0 
                    ? `${(stats.authorityLevels.recognized / stats.totalExperts) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">{stats.authorityLevels['thought-leader']}</div>
            <div className="text-xs text-gray-500">Thought Leader</div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-purple-500 h-2 rounded-full" 
                style={{ 
                  width: stats.totalExperts > 0 
                    ? `${(stats.authorityLevels['thought-leader'] / stats.totalExperts) * 100}%` 
                    : '0%' 
                }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}