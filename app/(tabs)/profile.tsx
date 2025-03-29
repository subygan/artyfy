import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { BlurView } from 'expo-blur';

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  const isDark = colorScheme === 'dark';
  const tint = Colors[colorScheme ?? 'light'].tint;
  const textColor = isDark ? '#ffffff' : '#000000';
  const bgColor = isDark ? '#121212' : '#f8f9fa';
  const cardBgColor = isDark ? '#1c1c1e' : '#ffffff';
  
  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to log out');
    }
  };

  const getInitials = () => {
    if (!user || !user.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: bgColor }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: textColor }]}>Profile</Text>
      </View>
      
      <View style={[styles.profileCard, { backgroundColor: cardBgColor }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatarContainer, { backgroundColor: tint }]}>
            {user?.photoURL ? (
              <Image source={{ uri: user.photoURL }} style={styles.avatar} />
            ) : (
              <Text style={styles.avatarText}>{getInitials()}</Text>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: textColor }]}>
              {user?.displayName || user?.email || 'User'}
            </Text>
            <Text style={[styles.userEmail, { color: isDark ? '#a0a0a0' : '#666666' }]}>
              {user?.email}
            </Text>
          </View>
        </View>
      </View>
      
      <View style={[styles.sectionCard, { backgroundColor: cardBgColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Account</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemIconContainer}>
            <IconSymbol name="person.crop.circle" size={22} color={tint} />
          </View>
          <Text style={[styles.menuItemText, { color: textColor }]}>Edit Profile</Text>
          <IconSymbol name="chevron.right" size={18} color={isDark ? '#8e8e93' : '#c7c7cc'} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemIconContainer}>
            <IconSymbol name="bell" size={22} color={tint} />
          </View>
          <Text style={[styles.menuItemText, { color: textColor }]}>Notifications</Text>
          <IconSymbol name="chevron.right" size={18} color={isDark ? '#8e8e93' : '#c7c7cc'} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemIconContainer}>
            <IconSymbol name="lock.shield" size={22} color={tint} />
          </View>
          <Text style={[styles.menuItemText, { color: textColor }]}>Privacy & Security</Text>
          <IconSymbol name="chevron.right" size={18} color={isDark ? '#8e8e93' : '#c7c7cc'} />
        </TouchableOpacity>
      </View>
      
      <View style={[styles.sectionCard, { backgroundColor: cardBgColor }]}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Preferences</Text>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemIconContainer}>
            <IconSymbol name="paintpalette" size={22} color={tint} />
          </View>
          <Text style={[styles.menuItemText, { color: textColor }]}>Appearance</Text>
          <IconSymbol name="chevron.right" size={18} color={isDark ? '#8e8e93' : '#c7c7cc'} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemIconContainer}>
            <IconSymbol name="globe" size={22} color={tint} />
          </View>
          <Text style={[styles.menuItemText, { color: textColor }]}>Language</Text>
          <IconSymbol name="chevron.right" size={18} color={isDark ? '#8e8e93' : '#c7c7cc'} />
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: cardBgColor }]}
        onPress={handleLogout}
      >
        <Text style={[styles.logoutText, { color: '#ff3b30' }]}>Log Out</Text>
      </TouchableOpacity>
      
      <View style={styles.versionContainer}>
        <Text style={[styles.versionText, { color: isDark ? '#8e8e93' : '#8e8e93' }]}>
          Version 1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
  },
  sectionCard: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  menuItemIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  menuItemText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  versionContainer: {
    marginTop: 8,
    marginBottom: 40,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 14,
  },
});
