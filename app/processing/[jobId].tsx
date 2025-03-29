import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, Image, Pressable } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { ProcessingApi, ProcessingJobDetailsResponse, FilteredImageStatus } from '@/api';

export default function JobDetailsScreen() {
  const { jobId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [job, setJob] = useState<ProcessingJobDetailsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchJobDetails();

    // If job is in a non-final state, refresh every 5 seconds
    if (job && (job.status === 'pending' || job.status === 'processing')) {
      const interval = setInterval(fetchJobDetails, 5000);
      setRefreshInterval(interval);
    }

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  }, [jobId, job?.status]);

  const fetchJobDetails = async () => {
    if (!jobId || typeof jobId !== 'string') {
      setError('Invalid job ID');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const jobDetails = await ProcessingApi.getJobDetails(jobId);
      setJob(jobDetails);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching job details:', err);
      setError(err.message || 'Failed to load job details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50'; // green
      case 'failed':
        return '#F44336'; // red
      case 'processing':
        return '#2196F3'; // blue
      default:
        return '#FFC107'; // yellow for pending
    }
  };

  const renderImageItem = ({ item }: { item: FilteredImageStatus }) => (
    <View style={styles.imageItem}>
      <View style={styles.imageContainer}>
        <Image 
          source={{ uri: item.original_url }} 
          style={styles.thumbnail} 
          resizeMode="cover"
        />
        {item.result_url && (
          <Image 
            source={{ uri: item.result_url }} 
            style={styles.thumbnail} 
            resizeMode="cover"
          />
        )}
      </View>
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
        <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
      </View>
    </View>
  );

  if (isLoading && !job) {
    return (
      <ThemedView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText style={styles.errorText}>Error: {error}</ThemedText>
        <Pressable 
          style={styles.refreshButton}
          onPress={fetchJobDetails}
        >
          <ThemedText style={styles.refreshButtonText}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  if (!job) {
    return (
      <ThemedView style={styles.errorContainer}>
        <ThemedText>Job not found</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: `Job #${jobId.toString().substring(0, 8)}...` }} />
      
      <View style={styles.jobHeader}>
        <ThemedText style={styles.title}>Processing Job Details</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(job.status) }]}>
          <Text style={styles.statusText}>{job.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Filter:</ThemedText>
          <ThemedText style={styles.infoValue}>{job.filter_id}</ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Progress:</ThemedText>
          <ThemedText style={styles.infoValue}>
            {job.completed_count}/{job.image_count} images
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Created:</ThemedText>
          <ThemedText style={styles.infoValue}>
            {new Date(job.created_at).toLocaleString()}
          </ThemedText>
        </View>
        <View style={styles.infoRow}>
          <ThemedText style={styles.infoLabel}>Updated:</ThemedText>
          <ThemedText style={styles.infoValue}>
            {new Date(job.updated_at).toLocaleString()}
          </ThemedText>
        </View>
      </View>
      
      <ThemedText style={styles.sectionTitle}>Images</ThemedText>
      {isLoading && (
        <ActivityIndicator 
          size="small" 
          color={Colors[colorScheme ?? 'light'].tint} 
          style={styles.refreshIndicator} 
        />
      )}
      
      <FlatList
        data={job.images}
        renderItem={renderImageItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={fetchJobDetails}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontWeight: 'bold',
    width: 80,
  },
  infoValue: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  refreshIndicator: {
    marginBottom: 12,
  },
  listContent: {
    flexGrow: 1,
  },
  imageItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  imageContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  thumbnail: {
    width: 120,
    height: 120,
    borderRadius: 6,
    marginRight: 12,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#F44336',
  },
  refreshButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
