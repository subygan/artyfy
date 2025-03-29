import { Image, StyleSheet, Platform, FlatList, Pressable, useWindowDimensions, Alert, View } from 'react-native';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import React from 'react';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// Define FilterItem interface
interface FilterItem {
  id: string;
  name: string;
  color?: string;
  isCreate?: boolean;
}

// Sample filter data - in a real app, this might come from an API or database
const FILTERS: FilterItem[] = [
  { id: 'create', name: 'Create New', isCreate: true },
  { id: '1', name: 'Vintage', color: '#E6BEAE' },
  { id: '2', name: 'Noir', color: '#363636' },
  { id: '3', name: 'Sepia', color: '#D4A76A' },
  { id: '4', name: 'Pastel', color: '#C9E4CA' },
  { id: '5', name: 'Dramatic', color: '#4A4E69' },
  { id: '6', name: 'Vibrant', color: '#F46036' },
  // Add more filters as needed
];

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const { width } = useWindowDimensions();

  // Calculate item size for 2 columns with margins
  const itemSize = (width - 64) / 2; // 16px padding sides (32 total) + 8px margin sides per item (32 total) = 64

  const navigateToFilter = (filter: FilterItem) => {
    if (filter.isCreate) {
      // Navigate to the filter screen with a special ID for creation
      router.push('/filter/new');
      // Alert.alert("Create Filter", "Navigate to filter creation screen (chat).");
      // Example navigation (replace with actual route when ready):
      // router.push('/filter-create-chat');
    } else {
      // Navigate to the filter screen with the specific filter ID
      router.push(`/filter/${filter.id}`);
      // Alert.alert("Apply Filter", `Navigate to apply screen for ${filter.name}.`);
      // Example navigation (replace with actual route when ready):
      // router.push({
      //   pathname: '/filter-apply', 
      //   params: { filterId: filter.id, filterName: filter.name }
      // });
    }
  };

  const renderFilterItem = ({ item }: { item: FilterItem }) => {
    const isDark = colorScheme === 'dark';
    const defaultBgColor = isDark ? Colors.dark.card : Colors.light.card;
    const createBgColor = isDark ? '#333' : '#e0e0e0';
    const createTextColor = isDark ? Colors.dark.text : Colors.light.text;
    const filterTextColor = item.name === 'Noir' ? '#FFFFFF' : '#000000'; // Example specific color handling

    return (
      <Pressable
        style={[
          styles.filterItem,
          {
            width: itemSize,
            height: itemSize,
            backgroundColor: item.isCreate ? createBgColor : item.color || defaultBgColor,
          }
        ]}
        onPress={() => navigateToFilter(item)}>
        {item.isCreate ? (
          <View style={styles.createContent}>
            <IconSymbol
              name="plus.circle.fill"
              size={40}
              color={createTextColor}
            />
            <ThemedText style={[styles.filterName, { color: createTextColor }]}>{item.name}</ThemedText>
          </View>
        ) : (
          <>
            <ThemedText style={[styles.filterName, { color: filterTextColor }]}>{item.name}</ThemedText>
            <IconSymbol
              name="wand.and.stars"
              size={24}
              color={filterTextColor}
            />
          </>
        )}
      </Pressable>
    );
  };

  return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">Artyfy</ThemedText>
          <ThemedText type="subtitle">Choose or create a filter style</ThemedText>
        </ThemedView>

        <FlatList
          data={FILTERS}
          renderItem={renderFilterItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Adjust as needed for status bar/notch
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20, // Add padding to avoid cutting off last row
  },
  columnWrapper: {
    marginBottom: 16,
  },
  filterItem: {
    marginHorizontal: 8, // Add horizontal margin for spacing
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-between',
    alignItems: 'center', // Center content for non-create cards
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  createContent: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  filterName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
