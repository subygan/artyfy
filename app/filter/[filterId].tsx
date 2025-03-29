// app/filter/[filterId].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getFilterData, FilterData } from '@/api/filters'; // Import the API functions
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/ui/IconSymbol'; // Assuming you have this

// Placeholder type for photos to upload/display
interface PhotoItem {
    id: string;
    uri: string; // Local URI or remote URL
    isUpload?: boolean;
}

export default function FilterScreen() {
    const router = useRouter();
    const { filterId } = useLocalSearchParams<{ filterId: string }>();
    const colorScheme = useColorScheme();
    const [filterData, setFilterData] = useState<FilterData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Placeholder photo data
    const [photos, setPhotos] = useState<PhotoItem[]>([
        { id: 'upload', uri: '', isUpload: true },
        // Add more photos here if needed, e.g., from device gallery
    ]);

    useEffect(() => {
        if (!filterId || filterId === 'new') {
            // Handle new filter creation state
            setFilterData({ id: 'new', prompt: 'Describe your new filter style...' });
            setIsLoading(false);
        } else {
            // Fetch existing filter data
            const fetchData = async () => {
                try {
                    setIsLoading(true);
                    const data = await getFilterData(filterId);
                    if (data) {
                        setFilterData(data);
                    } else {
                        setError('Filter not found.');
                        // Optionally navigate back or show a specific message
                    }
                } catch (err) {
                    console.error("Error fetching filter data:", err);
                    setError('Failed to load filter data.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [filterId]);

    const handleEditPress = () => {
        if (!filterId) return;
        router.push(`/filter/edit/${filterId}`); // Navigate to the edit screen
    };

    const handleUploadPress = () => {
        // TODO: Implement image picker logic
        Alert.alert("Upload Photo", "Implement image picker to add photos.");
    };

    const renderPhotoItem = ({ item }: { item: PhotoItem }) => {
        if (item.isUpload) {
            return (
                <Pressable style={[styles.photoTile, styles.uploadTile]} onPress={handleUploadPress}>
                     <IconSymbol name="plus.circle.fill" size={40} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText>Add Photo</ThemedText>
                </Pressable>
            );
        }
        // TODO: Render actual photo thumbnails
        return (
            <View style={styles.photoTile}>
                <Image source={{ uri: item.uri || 'https://via.placeholder.com/150' }} style={styles.photoImage} />
            </View>
        );
    };

    if (isLoading) {
        return <ThemedView style={styles.center}><ActivityIndicator size="large" /></ThemedView>;
    }

    if (error) {
        return <ThemedView style={styles.center}><ThemedText>Error: {error}</ThemedText></ThemedView>;
    }

    if (!filterData) {
         return <ThemedView style={styles.center}><ThemedText>No filter data available.</ThemedText></ThemedView>;
    }

    const isCreatingNew = filterId === 'new';

    return (
        <ThemedView style={styles.container}>
             <Stack.Screen options={{ title: isCreatingNew ? 'Create Filter' : filterData.prompt.substring(0, 20) + '...' }} />
            {/* Top Bar */}
            <Pressable onPress={handleEditPress} style={styles.topBar}>
                <View style={styles.promptContainer}>
                     <ThemedText style={styles.promptText} numberOfLines={2}>{filterData.prompt}</ThemedText>
                     {/* Simple Edit Icon */}
                     <IconSymbol name="pencil" size={18} color={Colors[colorScheme ?? 'light'].tint} />
                </View>
                 {/* Display small associated images - Placeholder */}
                 <View style={styles.imagePreviewContainer}>
                    {(filterData.imageUrls || []).slice(0, 3).map((url, index) => (
                        <Image key={index} source={{ uri: url }} style={styles.previewImage} />
                    ))}
                     {/* Show placeholder if no images */}
                    {(filterData.imageUrls || []).length === 0 && <View style={styles.previewImagePlaceholder}><ThemedText style={{fontSize: 10}}>No previews</ThemedText></View>}
                 </View>
            </Pressable>

            {/* Photo Upload/Display Area */}
            <FlatList
                data={photos}
                renderItem={renderPhotoItem}
                keyExtractor={(item) => item.id}
                numColumns={3} // Adjust as needed
                contentContainerStyle={styles.photoListContent}
                ListHeaderComponent={<ThemedText style={styles.sectionTitle}>Apply filter to photos:</ThemedText>}
            />
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    topBar: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.light.border, // Use dynamic color later
        backgroundColor: Colors.light.card, // Use dynamic color later
        marginBottom: 16,
    },
    promptContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start', // Align items to the start
        marginBottom: 8,
    },
    promptText: {
        fontSize: 16,
        fontWeight: '500',
        flex: 1, // Allow text to take available space
        marginRight: 8, // Add space between text and icon
    },
    imagePreviewContainer: {
         flexDirection: 'row',
         gap: 8, // Space between preview images
    },
    previewImage: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: '#eee', // Placeholder bg
    },
     previewImagePlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 4,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
        paddingHorizontal: 16,
    },
    photoListContent: {
        paddingHorizontal: 12, // Adjust for spacing around the grid
    },
    photoTile: {
        flex: 1,
        aspectRatio: 1,
        margin: 4, // Gutter between photos
        borderRadius: 8,
        backgroundColor: '#ddd', // Placeholder
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    uploadTile: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: Colors.light.text, // Use dynamic color later
        backgroundColor: 'transparent',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    }
});
