import { useState } from 'react';
import { ExpertSession } from '../types/expert';

interface SessionManagementPanelProps {
  sessions: ExpertSession[];
  activeSession: ExpertSession | null;
  onClose: () => void;
  onSwitchSession: (expertId: string) => Promise<void>;
}

export function SessionManagementPanel({
  sessions,
  activeSession,
  onClose,
  onSwitchSession,
}: SessionManagementPanelProps) {
  const [switchingTo, setSwitchingTo] = useState<string | null>(null);

  const handleSwitchSession = async (expertId: string) => {
    if (switchingTo) return; // Prevent multiple simultaneous switches
    
    setSwitchingTo(expertId);
    try {
      await onSwitchSession(expertId);
    } catch (error) {
      console.error('Failed to switch session:', error);
    } finally {
      setSwitchingTo(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'ready': return 'text-blue-600 bg-blue-100';
      case 'switching': return 'text-yellow-600 bg-yellow-100';
      case 'inactive': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlatformStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return '🟢';
      case 'warning': return '🟡';
      case 'error': return '🔴';
      case 'disconnected': return '⚫';
      default: return '⚫';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Session Management</h2>
            <p className="text-gray-600 text-sm mt-1">
              Manage expert sessions and platform connections
            </p>
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

        {/* Active Session Status */}
        {activeSession && (
          <div className="p-6 bg-green-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <h3 className="font-semibold text-green-800">
                Active Session: {activeSession.expertName}
              </h3>
              <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(activeSession.status)}`}>
                {activeSession.status.toUpperCase()}
              </span>
            </div>
            
            {/* Platform Connections */}
            <div className="mt-4">
              <p className="text-sm text-green-700 mb-2">Platform Connections:</p>
              <div className="flex flex-wrap gap-2">
                {activeSession.platformConnections.map(conn => (
                  <div key={conn.platform} className="flex items-center gap-1 text-sm">
                    <span>{getPlatformStatusIcon(conn.status)}</span>
                    <span className="capitalize">{conn.platform}</span>
                    {conn.lastCheck && (
                      <span className="text-gray-500 text-xs">
                        ({new Date(conn.lastCheck).toLocaleTimeString()})
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Proxy Status */}
            {activeSession.proxyStatus && (
              <div className="mt-3">
                <p className="text-sm text-green-700">
                  Proxy: {activeSession.proxyStatus.assigned ? (
                    <span className="text-green-600">
                      ✅ Assigned ({activeSession.proxyStatus.location || 'Unknown'})
                    </span>
                  ) : (
                    <span className="text-yellow-600">⚠️ Not Assigned</span>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Sessions List */}
        <div className="p-6 max-h-96 overflow-y-auto">
          <h3 className="font-semibold text-gray-900 mb-4">All Sessions</h3>
          
          {sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No expert sessions available.</p>
              <p className="text-gray-400 text-sm mt-1">Create an expert to start a session.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sessions.map((session) => (
                <div
                  key={session.expertId}
                  className={`border rounded-lg p-4 ${
                    activeSession?.expertId === session.expertId
                      ? 'border-green-200 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-medium text-gray-900">{session.expertName}</h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(session.status)}`}>
                          {session.status.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                        <span>
                          Platforms: {session.platformConnections.filter(p => p.connected).length}/{session.platformConnections.length}
                        </span>
                        {session.lastActivity && (
                          <span>
                            Last Activity: {new Date(session.lastActivity).toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {activeSession?.expertId !== session.expertId ? (
                        <button
                          onClick={() => handleSwitchSession(session.expertId)}
                          disabled={switchingTo !== null || session.status === 'switching'}
                          className={`px-3 py-1 text-sm rounded ${
                            switchingTo === session.expertId
                              ? 'bg-yellow-100 text-yellow-700 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {switchingTo === session.expertId ? 'Switching...' : 'Activate'}
                        </button>
                      ) : (
                        <span className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded">
                          Active
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Platform Status Details */}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {session.platformConnections.map(conn => (
                      <div
                        key={conn.platform}
                        className={`flex items-center gap-1 px-2 py-1 text-xs rounded ${
                          conn.connected ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <span>{getPlatformStatusIcon(conn.status)}</span>
                        <span className="capitalize">{conn.platform}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} total
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}