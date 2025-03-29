import { getAuth } from 'firebase/auth';
import { Alert, Clipboard } from 'react-native';

/**
 * Get the current user's Firebase ID token and display it
 * This is useful for testing APIs that require authentication
 */
export const displayFirebaseToken = async (): Promise<string | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    Alert.alert('Error', 'No user is currently logged in. Please login first.');
    return null;
  }
  
  try {
    const token = await user.getIdToken(true); // Force refresh
    
    // Display token and copy to clipboard
    Clipboard.setString(token);
    Alert.alert(
      'Firebase ID Token',
      'Token has been copied to clipboard. First part of token: ' + token.substring(0, 40) + '...',
      [
        { text: 'OK' }
      ]
    );
    
    console.log('Firebase ID Token:', token);
    return token;
  } catch (error) {
    console.error('Error getting Firebase token:', error);
    Alert.alert('Error', 'Failed to get Firebase token: ' + error);
    return null;
  }
};
