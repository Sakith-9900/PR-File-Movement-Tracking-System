import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/config/supabase';
import { toast } from 'sonner';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  // ── Role state (added for Leader/Worker system) ──────────────────────────────
  const [userRole, setUserRole] = useState(null);
  const [currentUserCode, setCurrentUserCode] = useState(null);
  const [currentUserDbId, setCurrentUserDbId] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  // ── Sync new user to public.users (ORIGINAL logic unchanged) ─────────────────
  const syncUserToPublicTable = async (authUser) => {
    if (!authUser) return;
    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id')
        .eq('id', authUser.id)
        .single();

      // PGRST116 is "Row not found" - expected for new users
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error("Error checking user existence:", fetchError);
        return;
      }

      if (!existingUser) {
        const { error: insertError } = await supabase.from('users').insert({
          id: authUser.id,
          email: authUser.email,
          short_code: authUser.email.split('@')[0].toUpperCase(),
          is_active: true,
          created_at: new Date().toISOString()
        });

        if (insertError) {
          console.error("Failed to sync user to public table:", insertError);
        } else {
          console.log("User synced to public table successfully");
        }
      }
    } catch (err) {
      console.error("Unexpected error syncing user:", err);
    }
  };

  // ── Fetch role separately (non-blocking, safe fallback) ──────────────────────
  const fetchUserRole = (authUserId) => {
    supabase
      .from('users')
      .select('id, role, short_code')
      .eq('id', authUserId)
      .single()
      .then(({ data, error }) => {
        if (error) {
          // Silently ignore — role column may not exist yet (SQL migration pending)
          console.warn('Could not fetch user role:', error.code, error.message);
          return;
        }
        if (data) {
          setUserRole(data.role || 'worker');
          setCurrentUserCode(data.short_code || null);
          setCurrentUserDbId(data.id || null);
        }
      })
      .catch((err) => {
        console.warn('Unexpected error fetching role:', err);
      });
  };

  // ── Main auth check (ORIGINAL logic + role fetch) ─────────────────────────────
  const checkAppState = async () => {
    try {
      setIsLoadingAuth(true);
      setAuthError(null);

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Session check failed:', error);
        setAuthError({
          type: 'auth_error',
          message: error.message
        });
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        setIsAuthenticated(true);
        // Original: fire-and-forget sync
        syncUserToPublicTable(session.user);
        // New: fire-and-forget role fetch (uses .then() not async/await)
        fetchUserRole(session.user.id);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setUserRole(null);
        setCurrentUserCode(null);
        setCurrentUserDbId(null);
      }

      setIsLoadingAuth(false);
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    await checkAppState();
  };

  const logout = async (shouldRedirect = true) => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setIsAuthenticated(false);
      setUserRole(null);
      setCurrentUserCode(null);
      setCurrentUserDbId(null);

      if (shouldRedirect) {
        window.location.href = '/login';
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  // ── Auth state listener (ORIGINAL — synchronous callback, fire-and-forget) ────
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          setIsAuthenticated(true);
          syncUserToPublicTable(session.user);
          fetchUserRole(session.user.id);
        } else {
          setUser(null);
          setIsAuthenticated(false);
          setUserRole(null);
          setCurrentUserCode(null);
          setCurrentUserDbId(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // ── Realtime User State Listener (Auto-logout) ───────────────────────────────
  useEffect(() => {
    if (!currentUserDbId) return;

    const userChannel = supabase.channel(`user-status-${currentUserDbId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'users',
          filter: `id=eq.${currentUserDbId}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            console.log('Account deleted by leader, logging out...');
            toast?.error('Your account has been removed.');
            logout();
          } else if (payload.eventType === 'UPDATE') {
            const newRecord = payload.new;
            if (newRecord.is_active === false) {
              console.log('Account deactivated by leader, logging out...');
              toast?.error('Your account has been deactivated.');
              logout();
            } else if (newRecord.role) {
              // Automatically update role if changed (e.g. promoted to leader)
              setUserRole(newRecord.role);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(userChannel);
    };
  }, [currentUserDbId]);

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  };

  const signUp = async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    });
    if (error) throw error;
    return data;
  };

  // Derived from role state
  const isLeader = userRole === 'leader';
  const isWorker = userRole === 'worker';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      login: signIn,
      signIn,
      signUp,
      logout,
      navigateToLogin,
      checkAppState,
      checkUserAuth,
      // Role values
      userRole,
      isLeader,
      isWorker,
      currentUserCode,
      currentUserDbId,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
