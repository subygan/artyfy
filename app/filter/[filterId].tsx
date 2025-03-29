// app/filter/[filterId].tsx
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, Image, Alert, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useColorScheme } from '@/hooks/useColorScheme';
import { FilterApi, FilterResponse, ImageApi, CreateFilterRequest, ProcessedImageResponse, ProcessingApi } from '@/api'; // Import ProcessingApi

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
    const [processedImages, setProcessedImages] = useState<ProcessedImageResponse[]>([]);
    const [isNewFilter, setIsNewFilter] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filterName, setFilterName] = useState('');
    const [filterDescription, setFilterDescription] = useState('');
    const [filterType, setFilterType] = useState('custom');
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

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
                    const newFilter = {
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
                    };
                    setFilter(newFilter);
                    setFilterName(newFilter.name);
                    setFilterDescription(newFilter.description);
                    setFilterType(newFilter.settings.type);
                    setIsNewFilter(true);
                    setPhotos([]);
                    setProcessedImages([]);
                    setError(null);
                    setIsLoading(false);
                    return;
                }
                
                // For existing filters, fetch data from API
                const filterData = await FilterApi.getFilterById(filterId);
                setFilter(filterData);
                setFilterName(filterData.name);
                setFilterDescription(filterData.description || '');
                setFilterType(filterData.settings.type);
                setIsNewFilter(false);
                
                // Convert filter example images to photo items if available
                if (filterData.example_image_url) {
                    setPhotos([{
                        id: 'example-1',
                        uri: filterData.example_image_url
                    }]);
                }
                
                // Fetch processed images for this filter
                try {
                    const processedImagesData = await FilterApi.getProcessedImagesByFilter(filterId);
                    setProcessedImages(processedImagesData);
                } catch (processedErr: any) {
                    console.error('Error fetching processed images:', processedErr);
                    // Don't set main error since the filter loaded successfully
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

        // Launch the image picker with MULTIPLE selection enabled
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true, // Enable multiple selection
            selectionLimit: 10, // Optional: limit number of selections
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            if (isNewFilter) {
                // For new filters, just add the image to the local state
                // It will be uploaded when the filter is saved
                const newPhotos = result.assets.map(asset => ({
                    id: `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
                    uri: asset.uri
                }));
                
                setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
                return;
            }
            
            setIsProcessing(true);
            
            try {
                // Upload multiple images in parallel
                const uploadPromises = result.assets.map(asset => 
                    ImageApi.uploadImage({ original_url: asset.uri })
                );
                
                // Wait for all uploads to complete
                const uploadedImages = await Promise.all(uploadPromises);
                
                // Add all new images to the photos list
                const newPhotos = uploadedImages.map(img => ({
                    id: img.id,
                    uri: img.original_url
                }));
                
                setPhotos(prevPhotos => [...prevPhotos, ...newPhotos]);
                
                // Auto-select the newly uploaded images
                setSelectedPhotos(prev => {
                    const updated = new Set(prev);
                    newPhotos.forEach(photo => updated.add(photo.id));
                    return updated;
                });
                
                Alert.alert(
                    "Images Uploaded", 
                    `${uploadedImages.length} image${uploadedImages.length !== 1 ? 's' : ''} uploaded successfully. They are now selected for processing.`
                );
            } catch (err: any) {
                console.error('Error uploading images:', err);
                Alert.alert("Upload Failed", err.message || "Failed to upload images");
            } finally {
                setIsProcessing(false);
            }
        }
    };

    const togglePhotoSelection = (photoId: string) => {
        setSelectedPhotos(prev => {
            const updated = new Set(prev);
            if (updated.has(photoId)) {
                updated.delete(photoId);
            } else {
                updated.add(photoId);
            }
            return updated;
        });
    };

    const handleProcessImages = async () => {
        if (!filter || !filterId || typeof filterId !== 'string') {
            Alert.alert("Error", "Invalid filter selected");
            return;
        }

        // Get selected image IDs, excluding examples
        const imageIds = Array.from(selectedPhotos)
            .filter(id => !id.startsWith('example-') && !id.startsWith('temp-'));
            
        if (imageIds.length === 0) {
            // Check if there are any valid images at all first
            const validImages = photos.filter(p => !p.id.startsWith('example-') && !p.id.startsWith('temp-'));
            
            if (validImages.length === 0) {
                Alert.alert("No Images", "Please upload at least one image before processing");
            } else {
                Alert.alert("No Images Selected", "Please select at least one image to process");
            }
            return;
        }
        
        try {
            setIsProcessing(true);
            
            // Call the processing API
            const jobResponse = await ProcessingApi.processImages({
                filter_id: filterId,
                image_ids: imageIds
            });
            
            // Navigate to the processing/job screen with the job ID
            router.push(`/processing/${jobResponse.job_id}`);
            
        } catch (err: any) {
            console.error('Error starting processing job:', err);
            Alert.alert("Processing Error", err.message || "Failed to start image processing");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveFilter = async () => {
        if (!filterName.trim()) {
            Alert.alert("Validation Error", "Filter name cannot be empty");
            return;
        }

        try {
            setIsSaving(true);
            console.log("Starting filter creation with name:", filterName);
            
            // Prepare the filter data
            const filterData: CreateFilterRequest = {
                name: filterName,
                description: filterDescription,
                settings: { 
                    type: filterType, 
                    params: {} 
                },
                is_public: false
            };
            
            console.log("Filter data prepared:", JSON.stringify(filterData));
            
            // If we have an example image, include it
            if (photos.length > 0) {
                console.log("Including example image from photos");
                // We need to convert the URI to a file object
                // This is a simplified approach - in a real app you might need to
                // fetch the actual file data and create a proper File object
                const exampleImageUri = photos[0].uri;
                
                // Create a mock File/Blob object that works with FormData
                // Note: The exact implementation might differ based on your platform and requirements
                const uriParts = exampleImageUri.split('.');
                const fileType = uriParts[uriParts.length - 1];
                
                // For React Native, we can pass the URI directly
                // The API client will handle it appropriately
                filterData.example_image = {
                    uri: exampleImageUri,
                    name: `example_image.${fileType}`,
                    type: `image/${fileType}`
                } as any;
                
                console.log("Added example image:", exampleImageUri);
            }
            
            console.log("Calling createFilter API method...");
            // Create the filter
            const newFilter = await FilterApi.createFilter(filterData);
            console.log("Filter created successfully:", newFilter);
            
            // Navigate to the newly created filter
            Alert.alert(
                "Success", 
                "Filter created successfully!",
                [
                    { 
                        text: "View Filter", 
                        onPress: () => router.replace(`/filter/${newFilter.id}`) 
                    }
                ]
            );
        } catch (err: any) {
            console.error('Error creating filter:', err);
            let errorMessage = err.message || "Failed to create filter";
            
            // Enhanced error reporting for network errors
            if (err.name === 'TypeError' && err.message.includes('Network request failed')) {
                errorMessage = "Network error. Please check your internet connection.";
            }
            
            // Log request details for debugging
            console.error('Filter data that failed:', JSON.stringify({
                name: filterName,
                description: filterDescription,
                type: filterType,
                photoCount: photos.length
            }));
            
            Alert.alert(
                "Error Creating Filter", 
                errorMessage,
                [
                    {
                        text: "Try Again",
                        onPress: handleSaveFilter
                    },
                    {
                        text: "OK",
                        style: "cancel"
                    }
                ]
            );
        } finally {
            setIsSaving(false);
        }
    };

    const renderPhotoItem = ({ item }: { item: GridItem }) => {
        const isSelected = selectedPhotos.has(item.id);
        
        if (item.isUpload) {
            return (
                <Pressable 
                    style={[styles.photoTile, styles.uploadTile]} 
                    onPress={handleUploadPress}
                    disabled={isProcessing || isSaving}
                >
                    <IconSymbol name="plus.circle.fill" size={40} color={Colors[colorScheme ?? 'light'].text} />
                    <ThemedText>Add Photo{isNewFilter ? '' : 's'}</ThemedText>
                </Pressable>
            );
        }
        
        // Don't allow selecting example images or temporary images for processing
        const canSelect = !isNewFilter && !item.id.startsWith('example-') && !item.id.startsWith('temp-');
        
        return (
            <Pressable 
                style={[
                    styles.photoTile, 
                    isSelected && styles.selectedPhotoTile
                ]} 
                onPress={() => canSelect && togglePhotoSelection(item.id)}
                disabled={!canSelect || isProcessing}
            >
                <Image source={{ uri: item.uri }} style={styles.photoImage} />
                {isSelected && (
                    <View style={styles.selectionOverlay}>
                        <IconSymbol name="checkmark.circle.fill" size={30} color="#FFFFFF" />
                    </View>
                )}
            </Pressable>
        );
    };

    const renderProcessedImageItem = ({ item }: { item: ProcessedImageResponse }) => {
        return (
            <View style={styles.processedTile}>
                <Image source={{ uri: item.processed_url }} style={styles.processedImage} />
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
                    title: isNewFilter ? 'Create New Filter' : filter?.name || 'Filter Details',
                    headerBackTitle: 'Back',
                }}
            />

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    {isNewFilter ? (
                        <>
                            <TextInput
                                style={[styles.textInput, styles.title]}
                                value={filterName}
                                onChangeText={setFilterName}
                                placeholder="Enter filter name"
                                placeholderTextColor="#999"
                                autoFocus={true}
                            />
                            <TextInput
                                style={[styles.textInput, styles.description]}
                                value={filterDescription}
                                onChangeText={setFilterDescription}
                                placeholder="Enter filter description"
                                placeholderTextColor="#999"
                                multiline
                            />
                        </>
                    ) : (
                        <>
                            <ThemedText style={styles.title}>{filter?.name || 'Unnamed Filter'}</ThemedText>
                            <ThemedText style={styles.description}>{filter?.description || 'No description available'}</ThemedText>
                        </>
                    )}
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>Filter Type</ThemedText>
                    {isNewFilter ? (
                        <Pressable 
                            style={styles.typeSelector}
                            onPress={() => {
                                // In a real app, you might show a picker here
                                // For simplicity, we'll just toggle between a few types
                                setFilterType(filterType === 'custom' ? 'artistic' : 'custom');
                            }}
                        >
                            <ThemedText>{filterType}</ThemedText>
                            <IconSymbol name="chevron.down" size={16} color={Colors[colorScheme ?? 'light'].text} />
                        </Pressable>
                    ) : (
                        <ThemedText>{filter?.settings?.type || 'Unknown'}</ThemedText>
                    )}
                </View>

                <View style={styles.section}>
                    <ThemedText style={styles.sectionTitle}>{isNewFilter ? 'Example Photo' : 'Your Photos'}</ThemedText>
                    <FlatList
                        data={itemsWithUpload}
                        renderItem={renderPhotoItem}
                        keyExtractor={item => item.id}
                        horizontal={true}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.photosList}
                    />
                </View>

                {!isNewFilter && processedImages.length > 0 && (
                    <View style={styles.section}>
                        <ThemedText style={styles.sectionTitle}>Processed Images</ThemedText>
                        <ThemedText style={styles.subtitle}>Images that have been processed with this filter</ThemedText>
                        <FlatList
                            data={processedImages}
                            renderItem={renderProcessedImageItem}
                            keyExtractor={item => item.id}
                            numColumns={2}
                            showsHorizontalScrollIndicator={false}
                            contentContainerStyle={styles.processedImagesGrid}
                            columnWrapperStyle={styles.columnWrapper}
                        />
                    </View>
                )}

                <View style={styles.actions}>
                    {isNewFilter ? (
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                {
                                    backgroundColor: Colors[colorScheme ?? 'light'].tint,
                                    opacity: pressed || isSaving ? 0.8 : 1
                                }
                            ]}
                            onPress={handleSaveFilter}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <ThemedText style={styles.buttonText}>Save Filter</ThemedText>
                            )}
                        </Pressable>
                    ) : (
                        <Pressable
                            style={({ pressed }) => [
                                styles.button,
                                {
                                    backgroundColor: Colors[colorScheme ?? 'light'].tint,
                                    opacity: (pressed || isProcessing || selectedPhotos.size === 0) ? 0.8 : 1
                                }
                            ]}
                            onPress={handleProcessImages}
                            disabled={isProcessing || selectedPhotos.size === 0}
                        >
                            {isProcessing ? (
                                <ActivityIndicator color="white" size="small" />
                            ) : (
                                <ThemedText style={styles.buttonText}>
                                    Process {selectedPhotos.size > 0 ? `${selectedPhotos.size} ` : ''}Images
                                </ThemedText>
                            )}
                        </Pressable>
                    )}
                </View>
            </ScrollView>
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
        padding: 16,
        marginBottom: 16,
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
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.7,
        marginBottom: 12,
    },
    photosList: {
        paddingVertical: 8,
    },
    photoTile: {
        width: 150,
        height: 150,
        marginRight: 12,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative', // For the selection overlay
    },
    selectedPhotoTile: {
        borderWidth: 3,
        borderColor: Colors.light.tint,
    },
    selectionOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    uploadTile: {
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderStyle: 'dashed',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    processedImagesGrid: {
        paddingVertical: 8,
    },
    columnWrapper: {
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    processedTile: {
        width: '48%',
        aspectRatio: 1,
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 8,
    },
    processedImage: {
        width: '100%',
        height: '100%',
    },
    textInput: {
        padding: 10,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        marginBottom: 12,
        backgroundColor: '#fff',
        color: '#000', // Ensuring text is visible regardless of theme
        fontSize: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 1,
    },
    typeSelector: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 8,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 4,
    },
    actions: {
        padding: 16,
        marginBottom: 32,
    },
    button: {
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
