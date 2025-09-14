import { useState, useEffect, useCallback } from 'react';
import { ExpertPersona, ExpertPersonaFormData, ExpertFilters, DashboardStats } from '../types/expert';

// API base URL for expert personas
const API_BASE = '/api/expert-personas';

export function useExpertPersonas() {
  const [experts, setExperts] = useState<ExpertPersona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ExpertFilters>({});

  // Fetch all expert personas
  const fetchExperts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(API_BASE);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch expert personas');
      }
      
      setExperts(data.data || []);
    } catch (err) {
      console.error('Error fetching experts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch experts');
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new expert persona
  const createExpert = async (expertData: ExpertPersonaFormData): Promise<ExpertPersona> => {
    try {
      const response = await fetch(API_BASE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expertData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create expert persona');
      }
      
      const newExpert = data.data;
      setExperts(prev => [...prev, newExpert]);
      
      return newExpert;
    } catch (err) {
      console.error('Error creating expert:', err);
      throw err;
    }
  };

  // Update expert persona
  const updateExpert = async (id: string, updates: Partial<ExpertPersonaFormData>): Promise<ExpertPersona> => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update expert persona');
      }
      
      const updatedExpert = data.data;
      setExperts(prev => prev.map(expert => 
        expert.id === id ? updatedExpert : expert
      ));
      
      return updatedExpert;
    } catch (err) {
      console.error('Error updating expert:', err);
      throw err;
    }
  };

  // Delete expert persona
  const deleteExpert = async (id: string): Promise<void> => {
    try {
      const response = await fetch(`${API_BASE}/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete expert persona');
      }
      
      setExperts(prev => prev.filter(expert => expert.id !== id));
    } catch (err) {
      console.error('Error deleting expert:', err);
      throw err;
    }
  };

  // Get filtered experts
  const filteredExperts = experts.filter(expert => {
    if (filters.expertiseFocus?.length && !filters.expertiseFocus.includes(expert.expertiseFocus as any)) {
      return false;
    }
    
    if (filters.authorityLevel?.length && !filters.authorityLevel.includes(expert.authorityLevel)) {
      return false;
    }
    
    if (filters.expertStatus?.length && !filters.expertStatus.includes(expert.expertStatus)) {
      return false;
    }
    
    if (filters.primaryMarketLocation?.length && !filters.primaryMarketLocation.includes(expert.primaryMarketLocation)) {
      return false;
    }
    
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      return expert.expertName.toLowerCase().includes(query) ||
             expert.expertiseFocus.toLowerCase().includes(query) ||
             expert.primaryMarketLocation.toLowerCase().includes(query);
    }
    
    return true;
  });

  // Calculate dashboard stats
  const stats: DashboardStats = {
    totalExperts: experts.length,
    activeExperts: experts.filter(e => e.expertStatus === 'active').length,
    activeSessions: experts.filter(e => e.expertStatus === 'active').length, // For now, same as active experts
    authorityLevels: {
      emerging: experts.filter(e => e.authorityLevel === 'emerging').length,
      established: experts.filter(e => e.authorityLevel === 'established').length,
      recognized: experts.filter(e => e.authorityLevel === 'recognized').length,
      'thought-leader': experts.filter(e => e.authorityLevel === 'thought-leader').length,
    },
    totalConsultationRequests: experts.reduce((sum, e) => sum + (e.monthlyConsultationRequests || 0), 0),
    averageAuthorityScore: experts.length > 0 
      ? experts.reduce((sum, e) => sum + (e.currentAuthorityScore || 0), 0) / experts.length 
      : 0,
  };

  // Initialize - fetch experts on mount
  useEffect(() => {
    fetchExperts();
  }, [fetchExperts]);

  return {
    experts: filteredExperts,
    allExperts: experts,
    loading,
    error,
    filters,
    stats,
    setFilters,
    fetchExperts,
    createExpert,
    updateExpert,
    deleteExpert,
  };
}