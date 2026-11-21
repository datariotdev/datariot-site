import { useState, useEffect } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../client';

interface AuthState {
    session: Session | null;
    user: User | null;
    loading: boolean;
}

export function useAuth() {
    const [authState, setAuthState] = useState<AuthState>({
        session: null,
        user: null,
        loading: Boolean(supabase),
    });

    useEffect(() => {
        if (!supabase) return;
        let active = true;
        let authEventReceived = false;
        const timeout = setTimeout(() => {
            if (active && !authEventReceived) setAuthState({ session: null, user: null, loading: false });
        }, 10_000);
        supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
            if (!active || authEventReceived) return;
            clearTimeout(timeout);
            setAuthState({ session, user: session?.user ?? null, loading: false });
        }).catch(() => {
            if (!active || authEventReceived) return;
            clearTimeout(timeout);
            setAuthState({ session: null, user: null, loading: false });
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event: any, session: Session | null) => {
            authEventReceived = true;
            clearTimeout(timeout);
            if (!active) return;
            setAuthState({
                session,
                user: session?.user ?? null,
                loading: false,
            });
        });

        return () => { active = false; clearTimeout(timeout); subscription.unsubscribe(); };
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!supabase) return { data: null, error: new Error('Sign-in is temporarily unavailable.') };
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        return { data, error };
    };

    const signUp = async (email: string, password: string, username: string) => {
        if (!supabase) return { data: null, error: new Error('Sign-up is temporarily unavailable.') };
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    username,
                    display_name: username,
                },
            },
        });
        return { data, error };
    };

    const signOut = async () => {
        if (!supabase) return { error: null };
        const { error } = await supabase.auth.signOut();
        return { error };
    };

    return {
        ...authState,
        signIn,
        signUp,
        signOut,
    };
}
