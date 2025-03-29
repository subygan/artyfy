import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
  User,
  getAuth,
  signInWithPopup
} from 'firebase/auth';
import { auth, googleProvider } from '../firebaseConfig';
import { Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import * as AuthSession from 'expo-auth-session';

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  error: string | null;
  setError: (error: string | null) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

type AuthProviderProps = {
  children: ReactNode;
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Set up Google Auth Request
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID', // Get this from Google Cloud Console
    androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Get this from Google Cloud Console
    iosClientId: 'YOUR_IOS_CLIENT_ID', // Get this from Google Cloud Console
  });

  // Handle Google Sign in response
  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .catch(err => {
          setError('Failed to sign in with Google: ' + err.message);
        });
    }
  }, [response]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      let errorMessage = 'Failed to sign in';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Try again later';
      }
      setError(errorMessage);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setError(null);
    try {
      if (Platform.OS === 'web') {
        // Web implementation
        try {
          await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
          console.error("Web Google sign-in error:", err);
          throw err;
        }
      } else {
        // Mobile implementation
        if (!request) {
          setError('Google Authentication request failed to initialize');
          throw new Error('Google Authentication request failed to initialize');
        }
        
        await promptAsync();
        // The result will be handled in the useEffect hook above
      }
    } catch (err: any) {
      let errorMessage = 'Failed to sign in with Google';
      if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      throw err;
    }
  };

  const register = async (email: string, password: string) => {
    setError(null);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      let errorMessage = 'Failed to register';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      }
      setError(errorMessage);
      throw err;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Failed to log out');
      throw err;
    }
  };

  const value = {
    user,
    loading,
    signInWithEmail,
    signInWithGoogle,
    register,
    logout,
    error,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
