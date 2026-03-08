import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, UserRole } from '../types';
const adminUser = {
  id: 'admin-1',
  name: 'Missal S Make',
  email: 'missal@makefarmhub.com',
  phone: '+263 77 000 0000',
  role: 'admin' as const,
  avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
  location: 'Harare, Zimbabwe',
  verified: true,
  createdAt: '2024-01-01',
};
import { supabase, testSupabaseConnection, isSupabaseReady } from '../lib/supabase';
import { profileService } from '../services/supabase/profileService';

const API_BASE = import.meta.env.VITE_API_URL || '';

const DEFAULT_AVATARS: Record<string, string> = {
  farmer: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  buyer: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  transporter: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  admin: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  checkUserExists: (identifier: string) => Promise<{ exists: boolean; user?: any }>;
  loginWithPassword: (identifier: string, password: string) => Promise<{ success: boolean; error?: string }>;
  login: (phone: string, otp: string, token: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, phone: string, email: string, role: UserRole, location: string, otp: string, token: string, password: string) => Promise<{ success: boolean; error?: string }>;
  sendOTP: (identifier: string, name?: string) => Promise<{ success: boolean; token?: string; error?: string }>;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  updateProfile: (updates: Partial<User>) => void;
  updateAvatar: (avatarUrl: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [useSupabase, setUseSupabase] = useState(false);

  // Helper: map Supabase profile to app User
  const mapProfileToUser = (profile: any): User => ({
    id: profile.id,
    name: profile.name || '',
    phone: profile.phone || '',
    email: profile.email || '',
    role: profile.role || 'buyer',
    location: profile.location || '',
    verified: profile.verified || false,
    avatar: profile.avatar || DEFAULT_AVATARS[profile.role] || DEFAULT_AVATARS.buyer,
    createdAt: profile.created_at?.split('T')[0] || new Date().toISOString().split('T')[0],
  });

  // Load user from localStorage immediately to prevent blank screen
  useEffect(() => {
    const storedUser = localStorage.getItem('makefarmhub_user');
    if (storedUser) {
      try { setUser(JSON.parse(storedUser)); } catch { localStorage.removeItem('makefarmhub_user'); }
    }

    // Test Supabase connection, then decide mode
    const init = async () => {
      try {
        const connected = await testSupabaseConnection();
        setUseSupabase(connected);

        if (connected) {
          // Check for real Supabase session
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
              try {
                const profile = await profileService.getProfile(session.user.id);
                const appUser = mapProfileToUser(profile);
                setUser(appUser);
                localStorage.setItem('makefarmhub_user', JSON.stringify(appUser));
              } catch {
                // Profile might not exist yet
              }
            }
          } catch {
            // getSession failed, keep localStorage user
          }
        }
      } catch {
        // Connection test itself failed
        setUseSupabase(false);
      }
      setIsLoading(false);
    };

    init();
  }, []);

  // Set up auth state listener when Supabase is confirmed working
  useEffect(() => {
    if (!useSupabase) return;

    let subscription: { unsubscribe: () => void } | null = null;
    try {
      const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          try {
            const profile = await profileService.getProfile(session.user.id);
            const appUser = mapProfileToUser(profile);
            setUser(appUser);
            localStorage.setItem('makefarmhub_user', JSON.stringify(appUser));
          } catch {
            // Profile might not exist yet (just signed up, trigger hasn't fired)
          }
        } else {
          setUser(null);
          localStorage.removeItem('makefarmhub_user');
        }
      });
      subscription = data.subscription;
    } catch (err) {
      console.warn('Failed to set up auth listener:', err);
    }

    return () => { subscription?.unsubscribe(); };
  }, [useSupabase]);

  // Check if user exists in system
  const checkUserExists = async (identifier: string): Promise<{ exists: boolean; user?: any }> => {
    if (useSupabase) {
      try {
        const isEmail = identifier.includes('@');
        // Check in profiles table
        const { data } = await supabase
          .from('profiles')
          .select('id, email, phone, name')
          .or(isEmail ? `email.eq.${identifier}` : `phone.eq.${identifier}`)
          .maybeSingle();
        
        if (data) return { exists: true, user: data };
      } catch {
        return { exists: false };
      }
    }
    
    // Check localStorage
    const storedUsers = JSON.parse(localStorage.getItem('makefarmhub_registered_users') || '[]');
    const user = storedUsers.find((u: any) => 
      u.email === identifier || u.phone === identifier || 
      u.phone?.replace(/\s/g, '') === identifier.replace(/\s/g, '')
    );
    return { exists: !!user, user };
  };

  // Login with password (for returning users)
  const loginWithPassword = async (identifier: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Admin shortcut
    if (identifier.includes('admin') || identifier.includes('000')) {
      if (password === 'admin' || password === '1234') {
        setUser(adminUser);
        localStorage.setItem('makefarmhub_user', JSON.stringify(adminUser));
        return { success: true };
      }
      return { success: false, error: 'Invalid credentials' };
    }

    if (useSupabase) {
      try {
        const isEmail = identifier.includes('@');
        const { data, error } = await supabase.auth.signInWithPassword(
          isEmail ? { email: identifier, password } : { phone: identifier, password }
        );
        
        if (error) {
          // Translate Supabase errors to user-friendly messages
          if (error.message.includes('Invalid login')) {
            return { success: false, error: 'Wrong password. Please try again.' };
          }
          if (error.message.includes('Email not confirmed')) {
            return { success: false, error: 'Please verify your email first.' };
          }
          return { success: false, error: error.message };
        }
        if (data.user) {
          try {
            const profile = await profileService.getProfile(data.user.id);
            const appUser = mapProfileToUser(profile);
            setUser(appUser);
            localStorage.setItem('makefarmhub_user', JSON.stringify(appUser));
          } catch {
            // Auth succeeded but profile not found - create minimal user from auth data
            const minimalUser: User = {
              id: data.user.id,
              name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
              phone: data.user.phone || '',
              email: data.user.email || '',
              role: (data.user.user_metadata?.role as any) || 'buyer',
              avatar: data.user.user_metadata?.avatar || '',
              location: data.user.user_metadata?.location || '',
              verified: false,
              createdAt: data.user.created_at || new Date().toISOString(),
            };
            setUser(minimalUser);
            localStorage.setItem('makefarmhub_user', JSON.stringify(minimalUser));
          }
          return { success: true };
        }
      } catch (err: any) {
        console.error('Login error:', err);
        return { success: false, error: 'Connection error. Please check your internet and try again.' };
      }
    }

    // Fallback: Check stored users (flexible phone matching)
    const storedUsers = JSON.parse(localStorage.getItem('makefarmhub_registered_users') || '[]');
    const cleanId = identifier.replace(/\s/g, '');
    const user = storedUsers.find((u: any) => 
      (u.email === identifier || u.phone === identifier || 
       u.phone?.replace(/\s/g, '') === cleanId ||
       u.email?.toLowerCase() === identifier.toLowerCase()) && u.password === password
    );
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      setUser(userWithoutPassword);
      localStorage.setItem('makefarmhub_user', JSON.stringify(userWithoutPassword));
      return { success: true };
    }
    
    return { success: false, error: 'Wrong email/phone or password. Please try again.' };
  };

  const sendOTP = async (identifier: string, name?: string): Promise<{ success: boolean; token?: string; error?: string }> => {
    // Always use custom OTP API for faster delivery via SendGrid
    try {
      const isEmail = identifier.includes('@');
      const response = await fetch(`${API_BASE}/api/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(isEmail ? { email: identifier } : { phone: identifier }),
          name,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Failed to send verification code' };
      }

      return { success: true, token: data.token };
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const login = async (phone: string, otp: string, token: string): Promise<{ success: boolean; error?: string }> => {
    // Check for admin login (special phone number)
    if (phone.includes('admin') || phone.includes('000')) {
      setUser(adminUser);
      localStorage.setItem('makefarmhub_user', JSON.stringify(adminUser));
      return { success: true };
    }

    if (useSupabase) {
      try {
        const isEmail = phone.includes('@');
        const { data, error } = isEmail
          ? await supabase.auth.verifyOtp({ email: phone, token: otp, type: 'email' })
          : await supabase.auth.verifyOtp({ phone, token: otp, type: 'sms' });

        if (error) return { success: false, error: error.message };

        if (data.user) {
          try {
            const profile = await profileService.getProfile(data.user.id);
            const appUser = mapProfileToUser(profile);
            setUser(appUser);
            localStorage.setItem('makefarmhub_user', JSON.stringify(appUser));
          } catch {
            // Profile not created yet by trigger, create manually
            const appUser: User = {
              id: data.user.id,
              name: data.user.user_metadata?.name || phone,
              phone: data.user.phone || phone,
              email: data.user.email || '',
              role: 'buyer',
              location: 'Zimbabwe',
              verified: true,
              avatar: DEFAULT_AVATARS.buyer,
              createdAt: new Date().toISOString().split('T')[0],
            };
            setUser(appUser);
            localStorage.setItem('makefarmhub_user', JSON.stringify(appUser));
          }
        }
        return { success: true };
      } catch {
        return { success: false, error: 'Verification failed. Please try again.' };
      }
    }

    // Fallback: custom OTP verification
    try {
      const response = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, otp }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { success: false, error: data.error || 'Verification failed' };
      }

      const storedUsers = JSON.parse(localStorage.getItem('makefarmhub_registered_users') || '[]');
      let foundUser = storedUsers.find((u: User) => u.phone.replace(/\s/g, '').includes(phone.replace(/\s/g, '')));

      if (!foundUser) {
        foundUser = {
          id: `user-${Date.now()}`,
          name: phone,
          phone,
          email: '',
          role: 'buyer' as UserRole,
          location: 'Zimbabwe',
          verified: true,
          avatar: DEFAULT_AVATARS.buyer,
          createdAt: new Date().toISOString().split('T')[0],
        };
      }

      setUser(foundUser);
      localStorage.setItem('makefarmhub_user', JSON.stringify(foundUser));
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  };

  const signup = async (name: string, phone: string, email: string, role: UserRole, location: string, otp: string, token: string, password: string): Promise<{ success: boolean; error?: string }> => {
    // Step 1: Verify OTP via custom API
    try {
      const verifyResponse = await fetch(`${API_BASE}/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, otp }),
      });

      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok) {
        return { success: false, error: verifyData.error || 'Invalid verification code' };
      }
    } catch {
      return { success: false, error: 'Network error verifying code. Please try again.' };
    }

    // Step 2: Create account
    if (useSupabase) {
      try {
        // Create Supabase account with password
        const signUpPayload = email
          ? { email, password, options: { data: { name, phone, role, location } } }
          : { phone, password, options: { data: { name, email, role, location } } };

        const { data: authData, error: authError } = await supabase.auth.signUp(signUpPayload);

        if (authError) {
          console.error('Supabase signup error:', authError.message);
          // If Supabase signup fails, fall through to local storage
        } else if (authData.user) {
          // Update profile
          try {
            await profileService.updateProfile(authData.user.id, { name, phone, email, location, role });
          } catch {
            await new Promise(resolve => setTimeout(resolve, 1000));
            try { await profileService.updateProfile(authData.user.id, { name, phone, email, location, role }); } catch {}
          }

          const appUser: User = {
            id: authData.user.id,
            name,
            phone,
            email: email || authData.user.email || '',
            role,
            location,
            verified: true,
            avatar: DEFAULT_AVATARS[role] || DEFAULT_AVATARS.buyer,
            createdAt: new Date().toISOString().split('T')[0],
          };
          setUser(appUser);
          localStorage.setItem('makefarmhub_user', JSON.stringify(appUser));
          return { success: true };
        }
      } catch (err) {
        console.warn('Supabase signup failed, using local storage:', err);
      }
    }

    // Fallback: store locally with password
    const newUser: any = {
      id: `user-${Date.now()}`,
      name,
      phone,
      email,
      role,
      location,
      password,
      verified: true,
      avatar: DEFAULT_AVATARS[role] || DEFAULT_AVATARS.buyer,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const storedUsers = JSON.parse(localStorage.getItem('makefarmhub_registered_users') || '[]');
    storedUsers.push(newUser);
    localStorage.setItem('makefarmhub_registered_users', JSON.stringify(storedUsers));

    const { password: _, ...userWithoutPassword } = newUser;
    setUser(userWithoutPassword);
    localStorage.setItem('makefarmhub_user', JSON.stringify(userWithoutPassword));
    return { success: true };
  };

  const logout = () => {
    if (useSupabase) {
      supabase.auth.signOut().catch(err => console.error('Supabase signout error:', err));
    }
    setUser(null);
    localStorage.removeItem('makefarmhub_user');
  };

  const switchRole = (role: UserRole) => {
    if (user) {
      if (useSupabase) {
        // Update role in DB
        const updatedUser = { ...user, role };
        setUser(updatedUser);
        localStorage.setItem('makefarmhub_user', JSON.stringify(updatedUser));
        profileService.updateProfile(user.id, { role }).catch(err => console.error('Error updating role:', err));
      } else {
        const roleUser = role === 'admin' ? adminUser : { ...user, role };
        setUser(roleUser as User);
        localStorage.setItem('makefarmhub_user', JSON.stringify(roleUser));
      }
    }
  };

  const updateProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      localStorage.setItem('makefarmhub_user', JSON.stringify(updatedUser));
      if (useSupabase) {
        profileService.updateProfile(user.id, {
          name: updates.name,
          phone: updates.phone,
          location: updates.location,
        }).catch(err => console.error('Error updating profile:', err));
      }
    }
  };

  const updateAvatar = (avatarUrl: string) => {
    if (user) {
      const updatedUser = { ...user, avatar: avatarUrl };
      setUser(updatedUser);
      localStorage.setItem('makefarmhub_user', JSON.stringify(updatedUser));
      if (useSupabase) {
        profileService.updateProfile(user.id, { avatar: avatarUrl })
          .catch(err => console.error('Error updating avatar:', err));
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      checkUserExists,
      loginWithPassword,
      login,
      signup,
      sendOTP,
      logout,
      switchRole,
      updateProfile,
      updateAvatar,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
