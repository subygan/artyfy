import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import ThemedText from '@/components/ThemedText';
import ThemedView from '@/components/ThemedView';
import { ProcessingApi, ProcessingJobResponse } from '@/api';

export default function ProcessingScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [jobs, setJobs] = useState<ProcessingJobResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setIsLoading(true);
      const userJobs = await ProcessingApi.getUserJobs();
      setJobs(userJobs);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching jobs:', err);
      setError(err.message || 'Failed to load jobs');
    } finally {
      setIsLoading(false);
    }
  };

  const viewJobDetails = (jobId: string) => {
    router.push(`/processing/${jobId}`);
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

  const renderJobItem = ({ item }: { item: ProcessingJobResponse }) => (
    <Pressable
      style={({ pressed }) => [
        styles.jobItem,
        { opacity: pressed ? 0.7 : 1 }
      ]}
      onPress={() => viewJobDetails(item.job_id)}
    >
      <View style={styles.jobHeader}>
        <ThemedText style={styles.jobId}>Job #{item.job_id.substring(0, 8)}...</ThemedText>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.jobDetails}>
        <ThemedText>Filter: {item.filter_id}</ThemedText>
        <ThemedText>Progress: {item.completed_count}/{item.image_count} images</ThemedText>
        <ThemedText>Created: {new Date(item.created_at).toLocaleString()}</ThemedText>
      </View>
    </Pressable>
  );

  if (isLoading) {
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
          onPress={fetchJobs}
        >
          <ThemedText style={styles.refreshButtonText}>Retry</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ title: 'Processing Jobs' }} />
      
      <ThemedText style={styles.title}>Your Processing Jobs</ThemedText>
      
      {jobs.length === 0 ? (
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>No processing jobs found</ThemedText>
          <Pressable
            style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}
            onPress={() => router.push('/filter')}
          >
            <ThemedText style={styles.buttonText}>Create New Job</ThemedText>
          </Pressable>
        </ThemedView>
      ) : (
        <FlatList
          data={jobs}
          renderItem={renderJobItem}
          keyExtractor={(item) => item.job_id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={fetchJobs}
        />
      )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  listContent: {
    flexGrow: 1,
  },
  jobItem: {
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobId: {
    fontWeight: 'bold',
    fontSize: 16,
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
  jobDetails: {
    gap: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    marginBottom: 20,
    opacity: 0.6,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    color: '#F44336',
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
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
