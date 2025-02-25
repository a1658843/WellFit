import { createContext, useContext, useState, useEffect } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { View, Text } from "react-native";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  hasCompletedProfile: boolean;
  setHasCompletedProfile: (value: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const checkProfileCompletion = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("profession_id")
        .eq("id", userId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking profile completion:", error);
        return;
      }

      setHasCompletedProfile(!!data?.profession_id);
    } catch (error) {
      console.error("Error checking profile completion:", error);
    }
  };

  useEffect(() => {
    // Single function to handle session updates
    const handleSession = async (newSession: Session | null) => {
      console.log("Handling session:", newSession ? "exists" : "null");
      setSession(newSession);
      if (newSession?.user) {
        await checkProfileCompletion(newSession.user.id);
      }
      setInitialized(true);
    };

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log("Initializing auth...");
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();
        await handleSession(initialSession);
      } catch (error) {
        console.error("Auth initialization error:", error);
        setInitialized(true);
      } finally {
        setLoading(false);
      }
    };

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      console.log("Auth state changed:", newSession ? "exists" : "null");
      await handleSession(newSession);
    });

    // Initialize
    initializeAuth();

    // Cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (!initialized) {
    return null;
  }

  const signUp = async (email: string, password: string) => {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) throw authError;

    if (authData.user) {
      // Create user record in users table
      const { error: dbError } = await supabase.from("users").insert([
        {
          id: authData.user.id,
          email: authData.user.email,
          created_at: new Date().toISOString(),
          xp_points: 0,
          subscription_status: "free",
        },
      ]);

      if (dbError) {
        console.error("Error creating user profile:", dbError);
        // If user record creation fails, delete the auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw dbError;
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loading,
        signUp,
        signIn,
        signOut,
        hasCompletedProfile,
        setHasCompletedProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
