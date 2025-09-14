import { useState, useEffect, useCallback } from 'react';
import { ExpertSession, SessionStatus, PlatformConnectionStatus, ProxyStatus } from '../types/expert';

// Session management hook with local storage persistence
export function useExpertSessions() {
  const [sessions, setSessions] = useState<ExpertSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Load sessions from localStorage on mount
  useEffect(() => {
    const savedSessions = localStorage.getItem('expert-sessions');
    const savedActiveSession = localStorage.getItem('active-session-id');
    
    if (savedSessions) {
      try {
        const parsedSessions = JSON.parse(savedSessions);
        setSessions(parsedSessions);
      } catch (err) {
        console.error('Failed to parse saved sessions:', err);
      }
    }
    
    if (savedActiveSession) {
      setActiveSessionId(savedActiveSession);
    }
  }, []);

  // Save sessions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('expert-sessions', JSON.stringify(sessions));
  }, [sessions]);

  // Save active session ID whenever it changes
  useEffect(() => {
    if (activeSessionId) {
      localStorage.setItem('active-session-id', activeSessionId);
    } else {
      localStorage.removeItem('active-session-id');
    }
  }, [activeSessionId]);

  // Create a new session for an expert
  const createSession = useCallback((expertId: string, expertName: string) => {
    const existingSession = sessions.find(s => s.expertId === expertId);
    if (existingSession) {
      return existingSession;
    }

    const newSession: ExpertSession = {
      expertId,
      expertName,
      status: 'inactive',
      platformConnections: [
        { platform: 'medium', connected: false, status: 'disconnected' },
        { platform: 'reddit', connected: false, status: 'disconnected' },
        { platform: 'quora', connected: false, status: 'disconnected' },
        { platform: 'facebook', connected: false, status: 'disconnected' },
        { platform: 'linkedin', connected: false, status: 'disconnected' },
      ],
      proxyStatus: {
        assigned: false,
        status: 'inactive',
      },
    };

    setSessions(prev => [...prev, newSession]);
    return newSession;
  }, [sessions]);

  // Switch to a different expert session
  const switchSession = useCallback(async (expertId: string): Promise<void> => {
    return new Promise((resolve) => {
      // Set current active session to switching
      if (activeSessionId) {
        setSessions(prev => prev.map(session => 
          session.expertId === activeSessionId 
            ? { ...session, status: 'switching' as SessionStatus }
            : session
        ));
      }

      // Set new session to switching
      setSessions(prev => prev.map(session => 
        session.expertId === expertId 
          ? { ...session, status: 'switching' as SessionStatus }
          : session
      ));

      // Simulate session switch delay
      setTimeout(() => {
        // Deactivate old session
        if (activeSessionId) {
          setSessions(prev => prev.map(session => 
            session.expertId === activeSessionId 
              ? { ...session, status: 'inactive' as SessionStatus }
              : session
          ));
        }

        // Activate new session
        setSessions(prev => prev.map(session => 
          session.expertId === expertId 
            ? { 
                ...session, 
                status: 'active' as SessionStatus,
                startTime: new Date().toISOString(),
                lastActivity: new Date().toISOString(),
              }
            : session
        ));

        setActiveSessionId(expertId);
        resolve();
      }, 1500); // Simulate switch time
    });
  }, [activeSessionId]);

  // Update session status
  const updateSessionStatus = useCallback((expertId: string, status: SessionStatus) => {
    setSessions(prev => prev.map(session => 
      session.expertId === expertId 
        ? { 
            ...session, 
            status,
            lastActivity: new Date().toISOString(),
          }
        : session
    ));
  }, []);

  // Update platform connection status
  const updatePlatformConnection = useCallback((
    expertId: string, 
    platform: string, 
    connected: boolean, 
    status: PlatformConnectionStatus['status']
  ) => {
    setSessions(prev => prev.map(session => 
      session.expertId === expertId 
        ? {
            ...session,
            platformConnections: session.platformConnections.map(conn =>
              conn.platform === platform
                ? { ...conn, connected, status, lastCheck: new Date().toISOString() }
                : conn
            ),
            lastActivity: new Date().toISOString(),
          }
        : session
    ));
  }, []);

  // Update proxy status
  const updateProxyStatus = useCallback((expertId: string, proxyStatus: Partial<ProxyStatus>) => {
    setSessions(prev => prev.map(session => 
      session.expertId === expertId 
        ? {
            ...session,
            proxyStatus: { ...session.proxyStatus, ...proxyStatus },
            lastActivity: new Date().toISOString(),
          }
        : session
    ));
  }, []);

  // End session
  const endSession = useCallback((expertId: string) => {
    setSessions(prev => prev.map(session => 
      session.expertId === expertId 
        ? { ...session, status: 'inactive' as SessionStatus }
        : session
    ));
    
    if (activeSessionId === expertId) {
      setActiveSessionId(null);
    }
  }, [activeSessionId]);

  // Get session by expert ID
  const getSession = useCallback((expertId: string) => {
    return sessions.find(session => session.expertId === expertId);
  }, [sessions]);

  // Get active session
  const activeSession = activeSessionId ? getSession(activeSessionId) : null;

  // Clear all sessions (for testing/reset)
  const clearAllSessions = useCallback(() => {
    setSessions([]);
    setActiveSessionId(null);
    localStorage.removeItem('expert-sessions');
    localStorage.removeItem('active-session-id');
  }, []);

  return {
    sessions,
    activeSession,
    activeSessionId,
    createSession,
    switchSession,
    updateSessionStatus,
    updatePlatformConnection,
    updateProxyStatus,
    endSession,
    getSession,
    clearAllSessions,
  };
}