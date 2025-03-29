import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ProcessingApi, ProcessingJobResponse } from '@/api';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function ProcessingListScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  
  const [jobs, setJobs] = useState<ProcessingJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all processing jobs
  useEffect(() => {
    async function fetchJobs() {
      try {
        setIsLoading(true);
        const jobsData = await ProcessingApi.getUserJobs();
        setJobs(jobsData);
        setError(null);
      } catch (err: any) {
        console.error('Error fetching jobs:', err);
        setError(err.message || 'Failed to load jobs');
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobs();
  }, []);

  // Function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4caf50'; // Green
      case 'failed':
        return '#f44336'; // Red
      case 'processing':
        return '#2196f3'; // Blue
      default:
        return '#ff9800'; // Orange for pending
    }
  };

  // Function to get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'checkmark.circle.fill';
      case 'failed':
        return 'exclamationmark.triangle.fill';
      case 'processing':
        return 'arrow.triangle.2.circlepath';
      default:
        return 'clock.fill';
    }
  };

  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Render each job item
  const renderJobItem = ({ item }: { item: ProcessingJobResponse }) => {
    const statusColor = getStatusColor(item.status);
    const statusIcon = getStatusIcon(item.status);
    
    return (
      <Pressable
        style={({ pressed }) => [
          styles.jobItem,
          { opacity: pressed ? 0.7 : 1 }
        ]}
        onPress={() => router.push(`/processing/${item.job_id}`)}
      >
        <View style={[styles.statusIndicator, { backgroundColor: statusColor }]}>
          <IconSymbol name={statusIcon} size={16} color="#fff" />
        </View>
        
        <View style={styles.jobInfo}>
          <ThemedText style={styles.jobTitle}>
            Job #{item.job_id.substring(0, 8)}...
          </ThemedText>
          
          <View style={styles.jobDetails}>
            <ThemedText style={styles.jobDetail}>
              Filter: {item.filter_id.substring(0, 6)}...
            </ThemedText>
            <ThemedText style={styles.jobDetail}>
              Images: {item.completed_count}/{item.image_count}
            </ThemedText>
            <ThemedText style={styles.jobDate}>
              {formatDate(item.created_at)}
            </ThemedText>
          </View>
        </View>
        
        <IconSymbol name="chevron.right" size={18} color={Colors[colorScheme ?? 'light'].text} />
      </Pressable>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Processing Jobs' }} />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} />
          <ThemedText style={styles.loadingText}>Loading your processing jobs...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Error state
  if (error) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Processing Jobs' }} />
        <View style={styles.centerContainer}>
          <IconSymbol name="exclamationmark.triangle" size={40} color="red" />
          <ThemedText style={styles.errorText}>{error}</ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Empty state
  if (jobs.length === 0) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen options={{ title: 'Processing Jobs' }} />
        <View style={styles.centerContainer}>
          <IconSymbol name="photo.on.rectangle" size={40} color={Colors[colorScheme ?? 'light'].text} />
          <ThemedText style={styles.emptyText}>No processing jobs found</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            Process images in the filter screens to see jobs here
          </ThemedText>
        </View>
      </ThemedView>
    );
  }

  // Job list
  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Processing Jobs' }} />
      
      <FlatList
        data={jobs}
        renderItem={renderJobItem}
        keyExtractor={(item) => item.job_id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    marginTop: 16,
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'bold',
  },
  emptySubtext: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.7,
  },
  listContent: {
    padding: 16,
  },
  jobItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#ddd',
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  jobInfo: {
    flex: 1,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  jobDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  jobDetail: {
    fontSize: 12,
    opacity: 0.7,
    marginRight: 8,
  },
  jobDate: {
    fontSize: 12,
    opacity: 0.7,
  },
});
