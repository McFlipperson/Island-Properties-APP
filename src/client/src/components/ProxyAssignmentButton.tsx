import React, { useState } from 'react';
import { ExpertPersona } from '../types/expert';
import { ProxySetupDocumentation } from './ProxySetupDocumentation';

interface ProxyStatus {
  id: string;
  personaId: string;
  assignmentStatus: 'unassigned' | 'testing' | 'active' | 'failed';
  proxyLocation: string;
  proxyStatus: string;
  isPhilippinesVerified?: boolean;
  detectedCity?: string;
  detectedCountry?: string;
  averageResponseTime?: number;
  connectionSuccessRate?: string;
  lastHealthCheck?: string;
  healthCheckStatus?: string;
}

interface ProxyAssignmentButtonProps {
  expert: ExpertPersona;
  onStatusChange?: (expertId: string, status: ProxyStatus | null) => void;
}

export function ProxyAssignmentButton({ expert, onStatusChange }: ProxyAssignmentButtonProps) {
  const [proxyStatus, setProxyStatus] = useState<ProxyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDocumentation, setShowDocumentation] = useState(false);

  // Load proxy status on component mount
  React.useEffect(() => {
    loadProxyStatus();
  }, [expert.id]);

  const loadProxyStatus = async () => {
    try {
      const response = await fetch(`/api/proxy-assignments/expert/${expert.id}`);
      const data = await response.json();
      
      if (data.success) {
        setProxyStatus(data.data);
        onStatusChange?.(expert.id, data.data);
      } else {
        setProxyStatus(null);
        onStatusChange?.(expert.id, null);
      }
    } catch (err) {
      console.error('Failed to load proxy status:', err);
      setError('Failed to load proxy status');
    }
  };

  const assignProxy = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/proxy-assignments/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personaId: expert.id,
          assignmentReason: `Manila proxy assignment for ${expert.expertName} - Philippines real estate authority building`
        }),
      });

      const data = await response.json();

      if (data.success) {
        const newStatus: ProxyStatus = {
          id: data.data.id,
          personaId: data.data.personaId,
          assignmentStatus: 'testing',
          proxyLocation: data.data.proxyLocation,
          proxyStatus: data.data.proxyStatus
        };
        
        setProxyStatus(newStatus);
        onStatusChange?.(expert.id, newStatus);
        
        // Poll for status updates during testing
        pollStatusUpdates();
      } else {
        setError(data.error || 'Failed to assign proxy');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Proxy assignment error:', err);
    } finally {
      setLoading(false);
    }
  };

  const pollStatusUpdates = async () => {
    const maxPolls = 12; // 60 seconds total (5s * 12)
    let pollCount = 0;

    const poll = async () => {
      if (pollCount >= maxPolls) return;
      pollCount++;

      try {
        // Load current status and check if we should continue polling
        const response = await fetch(`/api/proxy-assignments/expert/${expert.id}`);
        const data = await response.json();
        
        if (data.success && data.data) {
          setProxyStatus(data.data);
          onStatusChange?.(expert.id, data.data);
          
          // Continue polling if still in testing status
          if (data.data.assignmentStatus === 'testing') {
            setTimeout(poll, 5000);
          }
        } else {
          // No assignment found or error - stop polling
          setProxyStatus(null);
          onStatusChange?.(expert.id, null);
        }
      } catch (err) {
        console.error('Status polling error:', err);
        // Don't continue polling on errors
      }
    };

    setTimeout(poll, 3000); // Start polling after 3 seconds
  };

  const testProxy = async () => {
    if (!proxyStatus) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proxy-assignments/${proxyStatus.id}/test`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        // Reload status to get updated information
        await loadProxyStatus();
      } else {
        setError(data.error || 'Proxy test failed');
      }
    } catch (err) {
      setError('Test request failed');
      console.error('Proxy test error:', err);
    } finally {
      setLoading(false);
    }
  };

  const removeProxy = async () => {
    if (!proxyStatus) return;
    
    if (!window.confirm(`Remove proxy assignment for ${expert.expertName}?`)) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/proxy-assignments/${proxyStatus.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setProxyStatus(null);
        onStatusChange?.(expert.id, null);
      } else {
        setError(data.error || 'Failed to remove proxy');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Proxy removal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unassigned': return 'text-gray-500 bg-gray-100';
      case 'testing': return 'text-yellow-700 bg-yellow-100';
      case 'active': return 'text-green-700 bg-green-100';
      case 'failed': return 'text-red-700 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'unassigned': 
        return <div className="w-2 h-2 rounded-full bg-gray-400"></div>;
      case 'testing': 
        return <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></div>;
      case 'active': 
        return <div className="w-2 h-2 rounded-full bg-green-400"></div>;
      case 'failed': 
        return <div className="w-2 h-2 rounded-full bg-red-400"></div>;
      default: 
        return <div className="w-2 h-2 rounded-full bg-gray-400"></div>;
    }
  };

  if (!proxyStatus) {
    return (
      <div className="space-y-2">
        <button
          onClick={assignProxy}
          disabled={loading}
          className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Assigning Proxy...
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Assign Manila Proxy
            </>
          )}
        </button>
        
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Proxy Status Display */}
      <div className="bg-white border rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusIcon(proxyStatus.assignmentStatus)}
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(proxyStatus.assignmentStatus)}`}>
              {proxyStatus.assignmentStatus.toUpperCase()}
            </span>
          </div>
          <span className="text-xs text-gray-500">{proxyStatus.proxyLocation}</span>
        </div>

        {/* Connection Details */}
        {proxyStatus.assignmentStatus === 'active' && (
          <div className="grid grid-cols-2 gap-2 pt-2 border-t">
            {proxyStatus.isPhilippinesVerified && (
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs text-green-700">Philippines Verified</span>
              </div>
            )}
            
            {proxyStatus.detectedCity && (
              <div className="text-xs text-gray-600">
                📍 {proxyStatus.detectedCity}
              </div>
            )}
            
            {proxyStatus.averageResponseTime && (
              <div className="text-xs text-gray-600">
                ⏱️ {proxyStatus.averageResponseTime}ms
              </div>
            )}
            
            {proxyStatus.connectionSuccessRate && (
              <div className="text-xs text-gray-600">
                📊 {proxyStatus.connectionSuccessRate}% success
              </div>
            )}
          </div>
        )}

        {/* Success Display with Setup Guide */}
        {proxyStatus.assignmentStatus === 'active' && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded border border-green-100">
            <div className="flex items-center justify-between">
              <span>Manila proxy active and verified</span>
              <button
                onClick={() => setShowDocumentation(true)}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Setup Guide →
              </button>
            </div>
          </div>
        )}

        {/* Error Display */}
        {proxyStatus.assignmentStatus === 'failed' && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-100">
            Proxy connection failed. Check network connectivity.
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {proxyStatus.assignmentStatus !== 'testing' && (
          <button
            onClick={testProxy}
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
          >
            {loading ? (
              <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            Test
          </button>
        )}
        
        <button
          onClick={removeProxy}
          disabled={loading}
          className="flex-1 px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Remove
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Setup Documentation Modal */}
      {showDocumentation && proxyStatus?.assignmentStatus === 'active' && (
        <ProxySetupDocumentation
          proxyConfig={{
            host: '95.135.113.91',
            port: '46137',
            location: 'Manila, Philippines',
            type: 'Residential'
          }}
          onClose={() => setShowDocumentation(false)}
        />
      )}
    </div>
  );
}