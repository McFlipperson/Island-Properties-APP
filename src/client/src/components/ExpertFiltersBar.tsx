import { ExpertFilters, ExpertiseFocus, AuthorityLevel, ExpertStatus } from '../types/expert';

import React from 'react';

interface ExpertFiltersBarProps {
  filters: ExpertFilters;
  onFiltersChange: React.Dispatch<React.SetStateAction<ExpertFilters>>;
  expertCount: number;
}

export function ExpertFiltersBar({ filters, onFiltersChange, expertCount }: ExpertFiltersBarProps) {
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

  const expertStatusOptions: ExpertStatus[] = [
    'developing',
    'active',
    'paused',
    'archived',
  ];

  const marketLocationOptions = [
    'Manila',
    'Cebu',
    'Davao',
    'Makati',
    'Bonifacio Global City',
    'Quezon City',
    'Iloilo',
    'Baguio',
    'Palawan',
    'Boracay',
  ];

  function updateFilter<K extends keyof ExpertFilters>(
    key: K, 
    value: ExpertFilters[K]
  ) {
    onFiltersChange({ ...filters, [key]: value });
  }

  function toggleArrayValue<T>(array: T[] | undefined, value: T): T[] {
    const current = array || [];
    return current.includes(value)
      ? current.filter(item => item !== value)
      : [...current, value];
  }

  const clearFilters = () => {
    onFiltersChange({});
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof ExpertFilters];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search experts by name, specialization, or location..."
            value={filters.searchQuery || ''}
            onChange={(e) => updateFilter('searchQuery', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="text-sm text-gray-500">
          {expertCount} expert{expertCount !== 1 ? 's' : ''}
        </div>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Expertise Focus Filter */}
        <div className="relative">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                updateFilter(
                  'expertiseFocus',
                  toggleArrayValue(filters.expertiseFocus, e.target.value as ExpertiseFocus)
                );
                e.target.value = '';
              }
            }}
            className="appearance-none bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-100"
          >
            <option value="">+ Specialization</option>
            {expertiseFocusOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Authority Level Filter */}
        <div className="relative">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                updateFilter(
                  'authorityLevel',
                  toggleArrayValue(filters.authorityLevel, e.target.value as AuthorityLevel)
                );
                e.target.value = '';
              }
            }}
            className="appearance-none bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-100"
          >
            <option value="">+ Authority Level</option>
            {authorityLevelOptions.map(option => (
              <option key={option} value={option}>
                {option.replace('-', ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Expert Status Filter */}
        <div className="relative">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                updateFilter(
                  'expertStatus',
                  toggleArrayValue(filters.expertStatus, e.target.value as ExpertStatus)
                );
                e.target.value = '';
              }
            }}
            className="appearance-none bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-100"
          >
            <option value="">+ Status</option>
            {expertStatusOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Market Location Filter */}
        <div className="relative">
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) {
                updateFilter(
                  'primaryMarketLocation',
                  toggleArrayValue(filters.primaryMarketLocation, e.target.value)
                );
                e.target.value = '';
              }
            }}
            className="appearance-none bg-gray-50 border border-gray-300 rounded px-3 py-1 text-sm hover:bg-gray-100"
          >
            <option value="">+ Market Location</option>
            {marketLocationOptions.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.expertiseFocus?.map(focus => (
            <span
              key={focus}
              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded"
            >
              {focus}
              <button
                onClick={() => updateFilter(
                  'expertiseFocus',
                  toggleArrayValue(filters.expertiseFocus, focus)
                )}
                className="text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
          
          {filters.authorityLevel?.map(level => (
            <span
              key={level}
              className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded"
            >
              {level.replace('-', ' ')}
              <button
                onClick={() => updateFilter(
                  'authorityLevel',
                  toggleArrayValue(filters.authorityLevel, level)
                )}
                className="text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
          
          {filters.expertStatus?.map(status => (
            <span
              key={status}
              className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-sm rounded"
            >
              {status}
              <button
                onClick={() => updateFilter(
                  'expertStatus',
                  toggleArrayValue(filters.expertStatus, status)
                )}
                className="text-yellow-600 hover:text-yellow-800"
              >
                ×
              </button>
            </span>
          ))}
          
          {filters.primaryMarketLocation?.map(location => (
            <span
              key={location}
              className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded"
            >
              {location}
              <button
                onClick={() => updateFilter(
                  'primaryMarketLocation',
                  toggleArrayValue(filters.primaryMarketLocation, location)
                )}
                className="text-purple-600 hover:text-purple-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}