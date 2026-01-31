import { createContext, useContext, useState, useEffect } from 'react';
import supabase from '../supabaseClient';

const AuthContext = createContext();

const EMAIL_DOMAIN = 'frcscout.com';

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active sessions and sets the user
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for changes on auth state (logged in, signed out, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const getEmail = (username) => `${username}@${EMAIL_DOMAIN}`;

    // Sanitize error messages to hide email references
    const sanitizeError = (error) => {
        if (!error?.message) return error;
        const sanitized = { ...error };
        sanitized.message = error.message
            .replace(/email/gi, 'username')
            .replace(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ''); // Remove email addresses
        return sanitized;
    };

    const loginWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: window.location.origin
            }
        });
        if (error) throw error;
    };

    const logout = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{
            user,
            session,
            loginWithGoogle,
            logout,
            loading,
            username: user?.user_metadata?.full_name || user?.email?.split('@')[0]
        }}>
            {!loading && children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    return useContext(AuthContext);
};
