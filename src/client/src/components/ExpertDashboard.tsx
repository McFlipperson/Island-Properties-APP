import React, { useState } from 'react';
import { ExpertPersona, ExpertFilters, DashboardStats } from '../types/expert';
import { useExpertPersonas } from '../hooks/useExpertPersonas';
import { useExpertSessions } from '../hooks/useExpertSessions';
import { ExpertGrid } from './ExpertGrid';
import { ExpertCreationModal } from './ExpertCreationModal';
import { ExpertStatsCards } from './ExpertStatsCards';
import { ExpertFiltersBar } from './ExpertFiltersBar';
import { SessionManagementPanel } from './SessionManagementPanel';
import { ExportImportPanel } from './ExportImportPanel';

export function ExpertDashboard() {
  const { 
    experts, 
    loading, 
    error, 
    stats, 
    filters,
    setFilters,
    createExpert,
    updateExpert,
    deleteExpert,
  } = useExpertPersonas();
  
  const {
    sessions,
    activeSession,
    createSession,
    switchSession,
  } = useExpertSessions();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSessionPanel, setShowSessionPanel] = useState(false);
  const [showExportPanel, setShowExportPanel] = useState(false);

  const handleCreateExpert = async (expertData: any) => {
    try {
      const newExpert = await createExpert(expertData);
      createSession(newExpert.id, newExpert.expertName);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create expert:', err);
      throw err;
    }
  };

  const handleExpertAction = async (action: string, expert: ExpertPersona) => {
    switch (action) {
      case 'activate':
        await switchSession(expert.id);
        break;
      case 'edit':
        // TODO: Implement edit modal
        console.log('Edit expert:', expert.id);
        break;
      case 'delete':
        if (window.confirm(`Delete expert "${expert.expertName}"? This action cannot be undone.`)) {
          await deleteExpert(expert.id);
        }
        break;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-800 font-semibold">Error Loading Experts</h3>
        <p className="text-red-600 mt-1">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expert Management Dashboard</h1>
          <p className="text-gray-600">Manage your Philippines real estate expert personas</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => setShowExportPanel(true)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
          >
            Export/Import
          </button>
          <button
            onClick={() => setShowSessionPanel(true)}
            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 text-sm"
            disabled={experts.length === 0}
          >
            Session Manager
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Add Expert
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <ExpertStatsCards stats={stats} />

      {/* Active Session Alert */}
      {activeSession && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-800 font-medium">
                Active Session: {activeSession.expertName}
              </span>
              <span className="text-green-600 text-sm">
                Status: {activeSession.status}
              </span>
            </div>
            <button
              onClick={() => setShowSessionPanel(true)}
              className="text-green-700 text-sm hover:text-green-900"
            >
              Manage Session →
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <ExpertFiltersBar 
        filters={filters}
        onFiltersChange={setFilters}
        expertCount={experts.length}
      />

      {/* Expert Grid or Empty State */}
      {experts.length === 0 && !filters.searchQuery && Object.keys(filters).length <= 1 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No experts configured yet</h3>
            <p className="text-gray-600 mb-6">
              Create your first Philippines real estate expert persona to begin building authority and generating leads through AI citations.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Create Your First Expert
            </button>
          </div>
        </div>
      ) : (
        <ExpertGrid 
          experts={experts}
          onExpertAction={handleExpertAction}
          activeSessionId={activeSession?.expertId}
        />
      )}

      {/* Modals and Panels */}
      {showCreateModal && (
        <ExpertCreationModal
          onClose={() => setShowCreateModal(false)}
          onCreateExpert={handleCreateExpert}
        />
      )}

      {showSessionPanel && (
        <SessionManagementPanel
          sessions={sessions}
          activeSession={activeSession}
          onClose={() => setShowSessionPanel(false)}
          onSwitchSession={switchSession}
        />
      )}

      {showExportPanel && (
        <ExportImportPanel
          experts={experts}
          onClose={() => setShowExportPanel(false)}
          onImportComplete={() => {
            // Refresh experts after import
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}