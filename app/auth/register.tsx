import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform, 
  Image,
  Alert,
  ActivityIndicator 
} from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function RegisterScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register, error, setError } = useAuth();
  const colorScheme = useColorScheme();

  const isDark = colorScheme === 'dark';
  const tint = Colors[colorScheme ?? 'light'].tint;
  const textColor = isDark ? '#ffffff' : '#000000';
  const bgColor = isDark ? '#121212' : '#f8f9fa';
  const inputBgColor = isDark ? '#2a2a2a' : '#ffffff';
  const placeholderColor = isDark ? '#8e8e93' : '#c7c7cc';

  const handleRegister = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }
    
    try {
      setIsLoading(true);
      await register(email, password);
      router.replace('/');
    } catch (err) {
      // Error is handled in the context
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: bgColor }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('@/assets/images/icon.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={[styles.title, { color: textColor }]}>Artyfy</Text>
        <Text style={[styles.subtitle, { color: isDark ? '#a0a0a0' : '#666666' }]}>
          Create a new account
        </Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)} style={styles.errorDismiss}>
            <IconSymbol name="xmark" size={16} color="#ffffff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.formContainer}>
        <View style={[styles.inputContainer, { backgroundColor: inputBgColor }]}>
          <IconSymbol name="envelope" size={20} color={isDark ? '#8e8e93' : '#8e8e93'} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Email"
            placeholderTextColor={placeholderColor}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: inputBgColor }]}>
          <IconSymbol name="lock" size={20} color={isDark ? '#8e8e93' : '#8e8e93'} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Password"
            placeholderTextColor={placeholderColor}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <View style={[styles.inputContainer, { backgroundColor: inputBgColor }]}>
          <IconSymbol name="lock" size={20} color={isDark ? '#8e8e93' : '#8e8e93'} style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: textColor }]}
            placeholder="Confirm Password"
            placeholderTextColor={placeholderColor}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        <TouchableOpacity
          style={[styles.registerButton, { backgroundColor: tint }]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.registerButtonText}>Sign Up</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footerContainer}>
        <Text style={[styles.footerText, { color: isDark ? '#a0a0a0' : '#666666' }]}>
          Already have an account?{' '}
        </Text>
        <Link href="/auth/login" asChild>
          <TouchableOpacity>
            <Text style={[styles.footerLink, { color: tint }]}>Sign In</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
  },
  formContainer: {
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
  },
  registerButton: {
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  registerButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 16,
  },
  footerLink: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorText: {
    color: '#ffffff',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    padding: 4,
  },
});
