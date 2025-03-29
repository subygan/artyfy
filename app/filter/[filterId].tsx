// app/filter/[filterId].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FilterApi, FilterResponse, ImageApi } from '@/api'; // Import the new API services

// Define types matching our backend API
export interface PhotoItem {
    id: string;
    uri: string;
    isUpload?: boolean;
}

interface GridItem extends PhotoItem {
    isUpload?: boolean;
}

export default function FilterScreen() {
    const { filterId } = useLocalSearchParams();
    const router = useRouter();
    const colorScheme = useColorScheme();
    
    const [filter, setFilter] = useState<FilterResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [photos, setPhotos] = useState<PhotoItem[]>([]);

    // Fetch filter data when component mounts or filterId changes
    useEffect(() => {
        async function fetchFilterData() {
            if (!filterId || typeof filterId !== 'string') {
                setError('Invalid filter ID');
                setIsLoading(false);
                return;
            }

            try {
                setIsLoading(true);
                
                // Handle the special case for creating a new filter
                if (filterId === 'new') {
                    // Set default values for a new filter
                    setFilter({
                        id: '',
                        user_id: '',
                        name: 'New Filter',
                        description: 'Add a description for your filter',
                        settings: { type: 'custom', params: {} },
                        is_default: false,
                        is_public: false,
                        example_image_url: '',
                        popularity: 0,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });
                    setPhotos([]);
                    setError(null);
                    setIsLoading(false);
                    return;
                }
                
                // For existing filters, fetch data from API
                const filterData = await FilterApi.getFilterById(filterId);
                setFilter(filterData);
                
                // Convert filter example images to photo items if available
                if (filterData.example_image_url) {
                    setPhotos([{
                        id: 'example-1',
                        uri: filterData.example_image_url
                    }]);
                }
                
                setError(null);
            } catch (err: any) {
                console.error('Error fetching filter:', err);
                setError(err.message || 'Failed to load filter data');
            } finally {
                setIsLoading(false);
            }
        }

        fetchFilterData();
    }, [filterId]);

    const handleUploadPress = async () => {
        // Request permission to access the media library
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (status !== 'granted') {
            Alert.alert('Permission Required', 'We need access to your media library to upload photos.');
            return;
        }

        // Launch the image picker
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedImage = result.assets[0];
            
            try {
                // Upload the image URL to create a record in the database
                const imageRecord = await ImageApi.uploadImage({
                    original_url: selectedImage.uri
                });
                
                // Add the new image to the photos list
                setPhotos(prevPhotos => [
                    ...prevPhotos,
                    {
                        id: imageRecord.id,
                        uri: imageRecord.original_url
                    }
                ]);
                
                Alert.alert("Image Uploaded", "Your image has been uploaded successfully!");
            } catch (err: any) {
                console.error('Error uploading image:', err);
                Alert.alert("Upload Failed", err.message || "Failed to upload image");
            }
        }
    };

    const renderPhotoItem = ({ item }: { item: GridItem }) => {
        if (item.isUpload) {
            return (
                <Pressable style={[styles.photoTile, styles.uploadTile]} onPress={handleUploadPress}>
                    <IconSymbol name="plus.circle.fill" size={40} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText>Add Photo</ThemedText>
                </Pressable>
            );
        }
        return (
            <View style={styles.photoTile}>
                <Image source={{ uri: item.uri }} style={styles.photoImage} />
            </View>
        );
    };

    if (isLoading) {
        return <ThemedView style={styles.center}><ActivityIndicator size="large" /></ThemedView>;
    }

    if (error) {
        return <ThemedView style={styles.center}><ThemedText>Error: {error}</ThemedText></ThemedView>;
    }

    // Combine actual photos with the upload button item
    const itemsWithUpload: GridItem[] = [
        { id: 'upload', uri: '', isUpload: true },
        ...photos
    ];

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: filter?.name || 'Filter Details',
                    headerBackTitle: 'Back',
                }}
            />

            <View style={styles.header}>
                <ThemedText style={styles.title}>{filter?.name || 'Unnamed Filter'}</ThemedText>
                <ThemedText style={styles.description}>{filter?.description || 'No description available'}</ThemedText>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Filter Type</ThemedText>
                <ThemedText>{filter?.settings?.type || 'Unknown'}</ThemedText>
            </View>

            <View style={styles.section}>
                <ThemedText style={styles.sectionTitle}>Your Photos</ThemedText>
                <FlatList
                    data={itemsWithUpload}
                    renderItem={renderPhotoItem}
                    keyExtractor={item => item.id}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.photosList}
                />
            </View>

            <View style={styles.actions}>
                <Pressable
                    style={({ pressed }) => [
                        styles.button,
                        {
                            backgroundColor: Colors[colorScheme ?? 'light'].tint,
                            opacity: pressed ? 0.8 : 1
                        }
                    ]}
                    onPress={() => {
                        // Process images with selected filter
                        if (filter && photos.length > 0) {
                            Alert.alert(
                                "Process Images", 
                                "Do you want to process your images with this filter?",
                                [
                                    { text: "Cancel", style: "cancel" },
                                    { 
                                        text: "Process", 
                                        onPress: async () => {
                                            try {
                                                // Extract image IDs (excluding the example images that might not have real IDs)
                                                const imageIds = photos
                                                    .filter(photo => !photo.id.startsWith('example-'))
                                                    .map(photo => photo.id);
                                                
                                                if (imageIds.length === 0) {
                                                    Alert.alert("No Images", "Please upload at least one image to process");
                                                    return;
                                                }
                                                
                                                // Navigate to a processing screen or show progress here
                                                Alert.alert("Processing Started", "Your images are being processed. You'll be notified when they're ready.");
                                            } catch (err: any) {
                                                Alert.alert("Error", err.message || "Failed to start processing");
                                            }
                                        }
                                    }
                                ]
                            );
                        } else {
                            Alert.alert("No Images", "Please upload at least one image to process");
                        }
                    }}
                >
                    <ThemedText style={styles.buttonText}>Process Images</ThemedText>
                </Pressable>
            </View>
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
    },
    header: {
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    description: {
        fontSize: 16,
        opacity: 0.8,
    },
    section: {
        padding: 20,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#ccc',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 12,
    },
    photosList: {
        paddingVertical: 10,
    },
    photoTile: {
        width: 120,
        height: 120,
        borderRadius: 8,
        marginRight: 12,
        overflow: 'hidden',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    uploadTile: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#ccc',
        backgroundColor: 'rgba(200, 200, 200, 0.2)',
    },
    actions: {
        padding: 20,
        flexDirection: 'row',
        justifyContent: 'center',
    },
    button: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 200,
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
