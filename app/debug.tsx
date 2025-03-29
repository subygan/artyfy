import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { displayFirebaseToken } from '@/utils/tokenHelper';

export default function DebugScreen() {
  const colorScheme = useColorScheme();
  
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Debug Tools' }} />
      
      <ThemedText style={styles.title}>API Debug Tools</ThemedText>
      
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>Authentication</ThemedText>
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            {
              backgroundColor: Colors[colorScheme ?? 'light'].tint,
              opacity: pressed ? 0.8 : 1
            }
          ]}
          onPress={displayFirebaseToken}
        >
          <ThemedText style={styles.buttonText}>Get Firebase ID Token</ThemedText>
        </Pressable>
        
        <ThemedText style={styles.description}>
          This will display your current Firebase ID token and copy it to clipboard for API testing.
        </ThemedText>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  description: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 8,
  }
});
