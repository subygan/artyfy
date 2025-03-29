import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

type ProtectedRouteProps = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const colorScheme = useColorScheme();
  const router = useRouter();

  // If the authentication state is still loading, show a loading spinner
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator 
          size="large" 
          color={Colors[colorScheme ?? 'light'].tint} 
        />
      </View>
    );
  }

  // If the user is not authenticated, redirect to the login page
  if (!user) {
    return <Redirect href="/auth/login" />;
  }

  // If the user is authenticated, render the children
  return <>{children}</>;
}
