import { useState } from 'react';
import { ExpertPersona, ExpertExportData, ExpertImportResult } from '../types/expert';

interface ExportImportPanelProps {
  experts: ExpertPersona[];
  onClose: () => void;
  onImportComplete: () => void;
}

export function ExportImportPanel({ experts, onClose, onImportComplete }: ExportImportPanelProps) {
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ExpertImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const handleExport = () => {
    const exportData: ExpertExportData = {
      experts: experts,
      exportDate: new Date().toISOString(),
      version: '1.0.0',
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `expert-personas-${new Date().toISOString().split('T')[0]}.json`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(link.href);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/json') {
        setImportError('Please select a valid JSON file.');
        return;
      }
      setImportFile(file);
      setImportError(null);
      setImportResult(null);
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      setImportError('Please select a file to import.');
      return;
    }

    setImporting(true);
    setImportError(null);

    try {
      const fileContent = await importFile.text();
      const importData: ExpertExportData = JSON.parse(fileContent);

      // Validate the imported data structure
      if (!importData.experts || !Array.isArray(importData.experts)) {
        throw new Error('Invalid file format: Missing experts array');
      }

      let imported = 0;
      let skipped = 0;
      const errors: string[] = [];

      // Import each expert
      for (const expert of importData.experts) {
        try {
          // Prepare expert data for API (remove database-specific fields)
          const expertData = {
            expertName: expert.expertName,
            expertiseFocus: expert.expertiseFocus,
            targetBuyerSegments: expert.targetBuyerSegments,
            authorityLevel: expert.authorityLevel,
            primaryMarketLocation: expert.primaryMarketLocation,
            secondaryMarketAreas: expert.secondaryMarketAreas || [],
            geoContentSpecializations: expert.geoContentSpecializations,
            authorityBuildingTopics: expert.authorityBuildingTopics,
            citationWorthyExpertise: expert.citationWorthyExpertise,
            platformExpertiseFocus: expert.platformExpertiseFocus,
            contentPublicationSchedule: expert.contentPublicationSchedule,
            expertVoiceCharacteristics: expert.expertVoiceCharacteristics,
            browserFingerprintConfig: expert.browserFingerprintConfig || {
              viewport: { width: 1920, height: 1080 }
            },
            // Add required encrypted fields with placeholder values
            professionalBackgroundEncrypted: 'imported_profile',
            expertiseCredentialsEncrypted: 'imported_credentials', 
            marketExperienceEncrypted: 'imported_experience',
            personaEncryptionKeyId: 'imported_key_' + Date.now(),
          };

          const response = await fetch('/api/expert-personas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(expertData),
          });

          if (response.ok) {
            imported++;
          } else {
            const errorData = await response.json();
            // Check if it's a duplicate
            if (response.status === 409 || errorData.message?.includes('duplicate')) {
              skipped++;
            } else {
              errors.push(`${expert.expertName}: ${errorData.message || 'Import failed'}`);
            }
          }
        } catch (error) {
          errors.push(`${expert.expertName}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      setImportResult({ imported, skipped, errors });
      
      if (imported > 0) {
        // Small delay to let user see the result, then refresh
        setTimeout(() => {
          onImportComplete();
        }, 2000);
      }

    } catch (error) {
      console.error('Import error:', error);
      setImportError(error instanceof Error ? error.message : 'Failed to import file');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Export / Import Experts</h2>
            <p className="text-gray-600 text-sm mt-1">
              Backup your expert personas or import from another system
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

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Export Experts</h3>
            <p className="text-gray-600 text-sm mb-4">
              Download all your expert personas as a JSON file for backup or migration.
            </p>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {experts.length} expert{experts.length !== 1 ? 's' : ''} available for export
              </div>
              <button
                onClick={handleExport}
                disabled={experts.length === 0}
                className={`px-4 py-2 rounded text-sm ${
                  experts.length > 0
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Download JSON
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div className="border border-gray-200 rounded-lg p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Import Experts</h3>
            <p className="text-gray-600 text-sm mb-4">
              Upload a JSON file containing expert personas to import them into your system.
            </p>

            {/* File Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select JSON File
              </label>
              <input
                type="file"
                accept=".json,application/json"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            {/* Import Button */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {importFile ? `Selected: ${importFile.name}` : 'No file selected'}
              </div>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className={`px-4 py-2 rounded text-sm ${
                  importFile && !importing
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {importing ? 'Importing...' : 'Import Experts'}
              </button>
            </div>

            {/* Import Error */}
            {importError && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                <p className="text-red-800 text-sm">{importError}</p>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-medium text-blue-900 mb-2">Import Complete!</h4>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>✅ Imported: {importResult.imported} experts</p>
                  {importResult.skipped > 0 && (
                    <p>⚠️ Skipped: {importResult.skipped} experts (duplicates)</p>
                  )}
                  {importResult.errors.length > 0 && (
                    <div>
                      <p>❌ Errors: {importResult.errors.length}</p>
                      <ul className="mt-1 ml-4 text-xs">
                        {importResult.errors.slice(0, 3).map((error, idx) => (
                          <li key={idx}>• {error}</li>
                        ))}
                        {importResult.errors.length > 3 && (
                          <li>• ... and {importResult.errors.length - 3} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
                {importResult.imported > 0 && (
                  <p className="text-xs text-blue-600 mt-2">
                    Refreshing dashboard in a moment...
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">💡 Tips</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Export files include all expert data and can be used for backup</li>
              <li>• Import will skip experts with duplicate names to prevent conflicts</li>
              <li>• Large import files may take a moment to process</li>
              <li>• Encrypted fields will be regenerated during import for security</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-end">
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