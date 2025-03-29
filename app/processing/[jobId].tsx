import React, { useState, useEffect } from 'react';
import { View, ScrollView, StyleSheet, Image, FlatList, Pressable, ActivityIndicator, Share, Alert } from 'react-native';
import { useLocalSearchParams, Stack, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ProcessingApi, ProcessingJobDetailsResponse, FilteredImageStatus } from '@/api';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProcessingJobScreen() {
  const params = useLocalSearchParams();
  const jobId = typeof params.jobId === 'string' ? params.jobId : Array.isArray(params.jobId) ? params.jobId[0] : '';
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [job, setJob] = useState<ProcessingJobDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  // Fetch job status and set up polling for updates
  useEffect(() => {
    if (!jobId) {
      setError('Invalid job ID');
      setIsLoading(false);
      return;
    }

    // Function to fetch job details
    async function fetchJobDetails() {
      try {
        const jobDetails = await ProcessingApi.getJobDetails(jobId);
        setJob(jobDetails);
        setError(null);
        
        // If the job is complete or failed, stop polling
        if (jobDetails.status === 'completed' || jobDetails.status === 'failed') {
          if (refreshInterval) {
            clearInterval(refreshInterval);
            setRefreshInterval(null);
          }
        }
      } catch (err: any) {
        console.error('Error fetching job details:', err);
        setError(err.message || 'Failed to load job details');
        
        // Stop polling on error
        if (refreshInterval) {
          clearInterval(refreshInterval);
          setRefreshInterval(null);
        }
      } finally {
        setIsLoading(false);
      }
    }

    // Initial fetch
    fetchJobDetails();
    
    // Set up polling if job is still in progress
    if (!refreshInterval) {
      const interval = setInterval(fetchJobDetails, 5000); // Poll every 5 seconds
      setRefreshInterval(interval);
    }

    // Cleanup function
    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [jobId]);

  // Function to handle sharing a processed image
  const handleShareImage = async (image: FilteredImageStatus) => {
    if (!image.result_url) {
      Alert.alert('Error', 'Image not yet processed');
      return;
    }

    try {
      await Share.share({
        url: image.result_url,
        message: 'Check out this image I created with Artyfy!',
      });
    } catch (error) {
      Alert.alert('Error', 'Could not share image');
    }
  };

  // Function to handle viewing a processed image in full screen
  const handleViewImage = (image: FilteredImageStatus) => {
    if (!image.result_url) {
      Alert.alert('Error', 'Image not yet processed');
      return;
    }

    // Navigate to a full-screen image viewer 
    // This could be implemented as a separate screen
    Alert.alert('View Image', 'This would open a full-screen image viewer');
  };

  // Get the progress percentage
  const calculateProgress = () => {
    if (!job) return 0;
    return Math.round((job.completed_count / job.image_count) * 100);
  };

  // Render a single image item in the grid
  const renderImageItem = ({ item }: { item: FilteredImageStatus }) => {
    const isPending = item.status === 'pending' || item.status === 'processing';
    const isFailed = item.status === 'failed';
    
    return (
      <View style={styles.imageContainer}>
        <View style={styles.imageWrapper}>
          {isPending ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
              <ThemedText style={styles.statusText}>Processing...</ThemedText>
            </View>
          ) : isFailed ? (
            <View style={styles.errorContainer}>
              <IconSymbol name="exclamationmark.triangle" size={40} color="red" />
              <ThemedText style={styles.errorText}>Failed</ThemedText>
            </View>
          ) : (
            <>
              <Image
                source={{ uri: item.result_url || '' }}
                style={styles.resultImage}
                resizeMode="cover"
              />
              <View style={styles.imageOverlay}>
                <View style={styles.imageActions}>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleShareImage(item)}
                  >
                    <IconSymbol name="square.and.arrow.up" size={24} color="white" />
                  </Pressable>
                  <Pressable
                    style={styles.actionButton}
                    onPress={() => handleViewImage(item)}
                  >
                    <IconSymbol name="arrow.up.left.and.arrow.down.right" size={24} color="white" />
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>
        {item.original_url && (
          <View style={styles.originalImageThumbnail}>
            <Image
              source={{ uri: item.original_url }}
              style={styles.thumbnailImage}
              resizeMode="cover"
            />
          </View>
        )}
      </View>
    );
  };

  // Loading state
  if (isLoading && !job) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Processing Images' }} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Fetching job details...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Processing Error' }} />
        <View style={styles.errorContainer}>
          <IconSymbol name="exclamationmark.triangle" size={64} color="red" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
          <Pressable
            style={styles.button}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // No job found state
  if (!job) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Processing Job' }} />
        <View style={styles.errorContainer}>
          <ThemedText style={styles.errorText}>Job not found</ThemedText>
          <Pressable
            style={styles.button}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>Go Back</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // Normal render with job details
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: job.status === 'completed' ? 'Processing Complete' : 'Processing Images',
        headerBackTitle: 'Back' 
      }} />
      
      <ScrollView style={styles.scrollView}>
        <View style={styles.jobHeader}>
          <View style={styles.statusContainer}>
            <ThemedText style={styles.statusLabel}>Status:</ThemedText>
            <ThemedText 
              style={[
                styles.statusValue, 
                job.status === 'completed' ? styles.statusCompleted : 
                job.status === 'failed' ? styles.statusFailed : 
                styles.statusProcessing
              ]}
            >
              {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
            </ThemedText>
          </View>
          
          <View style={styles.progressContainer}>
            <ThemedText style={styles.progressText}>
              Progress: {calculateProgress()}% ({job.completed_count}/{job.image_count})
            </ThemedText>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${calculateProgress()}%` },
                  job.status === 'completed' ? styles.progressBarCompleted :
                  job.status === 'failed' ? styles.progressBarFailed :
                  styles.progressBarProcessing
                ]} 
              />
            </View>
          </View>
        </View>
        
        <ThemedText style={styles.sectionTitle}>
          {job.status === 'completed' ? 'Processed Images' : 'Processing Images'}
        </ThemedText>
        
        <FlatList
          data={job.images}
          renderItem={renderImageItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.imageGrid}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false} // Disable scrolling as we're in a ScrollView
        />
        
        <View style={styles.actions}>
          <Pressable
            style={styles.button}
            onPress={() => router.back()}
          >
            <ThemedText style={styles.buttonText}>Back to Filter</ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  jobHeader: {
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#ccc',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusProcessing: {
    color: '#f8c51c', // Yellow for processing
  },
  statusCompleted: {
    color: '#4caf50', // Green for completed
  },
  statusFailed: {
    color: '#f44336', // Red for failed
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
  },
  progressBarProcessing: {
    backgroundColor: '#f8c51c', // Yellow for processing
  },
  progressBarCompleted: {
    backgroundColor: '#4caf50', // Green for completed
  },
  progressBarFailed: {
    backgroundColor: '#f44336', // Red for failed
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
    paddingBottom: 8,
  },
  imageGrid: {
    padding: 8,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  imageContainer: {
    width: '48%',
    marginBottom: 16,
    position: 'relative',
  },
  imageWrapper: {
    aspectRatio: 1,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultImage: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    padding: 8,
  },
  imageActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 8,
  },
  originalImageThumbnail: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 40,
    height: 40,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: 'white',
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  statusText: {
    marginTop: 8,
    fontSize: 14,
  },
  actions: {
    padding: 16,
    alignItems: 'center',
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginVertical: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
