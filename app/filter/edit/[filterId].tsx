// app/filter/edit/[filterId].tsx
import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, Pressable, ActivityIndicator, Alert, Text } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { getFilterData, updateFilterData, createFilter, FilterData } from '@/api/filters'; // Import API functions
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function EditFilterScreen() {
    const router = useRouter();
    const { filterId } = useLocalSearchParams<{ filterId: string }>();
    const colorScheme = useColorScheme();
    const [prompt, setPrompt] = useState('');
    const [originalPrompt, setOriginalPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isCreatingNew = filterId === 'new';

    useEffect(() => {
        if (isCreatingNew) {
            setPrompt(''); // Start with empty prompt for new filter
            setOriginalPrompt('');
             setIsLoading(false);
        } else if (filterId) {
            const fetchData = async () => {
                try {
                     setIsLoading(true);
                    const data = await getFilterData(filterId);
                    if (data) {
                        setPrompt(data.prompt);
                        setOriginalPrompt(data.prompt);
                    } else {
                        setError('Filter not found.');
                    }
                } catch (err) {
                    console.error("Error fetching filter data:", err);
                    setError('Failed to load filter details.');
                } finally {
                     setIsLoading(false);
                }
            };
            fetchData();
        }
    }, [filterId, isCreatingNew]);


    const handleSave = async () => {
        if (!prompt.trim()) {
            Alert.alert("Error", "Prompt cannot be empty.");
            return;
        }

        setIsSaving(true);
        setError(null);
        let success = false;
        let newFilterId = filterId;

        try {
            if (isCreatingNew) {
                 // Call create API
                 const newFilter = await createFilter(prompt);
                 if (newFilter) {
                     success = true;
                     newFilterId = newFilter.id; // Get the ID assigned by the backend
                     Alert.alert("Success", "New filter created!");
                 } else {
                     setError('Failed to create filter.');
                 }

            } else if (filterId) {
                 // Call update API
                const filterData: FilterData = { id: filterId, prompt }; // Include other fields if needed
                success = await updateFilterData(filterData);
                 if (success) {
                     Alert.alert("Success", "Filter updated!");
                 } else {
                     setError('Failed to update filter.');
                 }
            }

             if (success && newFilterId) {
                 // Navigate back to the main filter screen (or potentially the newly created filter)
                 // Using replace to avoid going back to the edit screen from the filter screen
                 if (isCreatingNew) {
                     router.replace(`/filter/${newFilterId}`);
                 } else {
                      router.back();
                 }
             }

        } catch (err) {
            console.error("Error saving filter:", err);
            setError('An unexpected error occurred.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <ThemedView style={styles.center}><ActivityIndicator size="large" /></ThemedView>;
    }

    if (error && !isSaving) { // Don't show loading error if save failed
        return <ThemedView style={styles.center}><ThemedText>Error: {error}</ThemedText></ThemedView>;
    }

    const inputBgColor = Colors[colorScheme ?? 'light'].card;
    const textColor = Colors[colorScheme ?? 'light'].text;
    const placeholderTextColor = Colors[colorScheme ?? 'light'].textMuted;
    const buttonDisabled = isLoading || isSaving || prompt === originalPrompt;


    return (
        <ThemedView style={styles.container}>
             <Stack.Screen options={{ title: isCreatingNew ? "Create Filter Prompt" : "Edit Filter Prompt" }} />
            <ThemedText style={styles.label}>Filter Prompt:</ThemedText>
            <TextInput
                style={[styles.input, { backgroundColor: inputBgColor, color: textColor, borderColor: Colors[colorScheme ?? 'light'].border }]}
                value={prompt}
                onChangeText={setPrompt}
                placeholder="e.g., Cinematic, vibrant, golden hour..."
                 placeholderTextColor={placeholderTextColor}
                multiline
                editable={!isSaving} // Disable input while saving
            />

             {error && isSaving && <ThemedText style={styles.errorText}>Error: {error}</ThemedText>}

            <Pressable
                 style={[styles.button, { backgroundColor: Colors[colorScheme ?? 'light'].tint }, buttonDisabled && styles.buttonDisabled]}
                 onPress={handleSave}
                 disabled={buttonDisabled}
             >
                 {isSaving ? (
                     <ActivityIndicator color="#fff" />
                 ) : (
                     <Text style={styles.buttonText}>{isCreatingNew ? 'Create Filter' : 'Save Changes'}</Text>
                 )}
             </Pressable>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
    },
    center: {
         flex: 1,
         justifyContent: 'center',
         alignItems: 'center',
     },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        minHeight: 100, // Adjust height as needed
        textAlignVertical: 'top', // Align text to top for multiline
        marginBottom: 20,
    },
     button: {
         paddingVertical: 12,
         paddingHorizontal: 24,
         borderRadius: 8,
         alignItems: 'center',
         justifyContent: 'center',
     },
     buttonDisabled: {
         opacity: 0.6,
     },
     buttonText: {
         color: '#fff',
         fontSize: 16,
         fontWeight: 'bold',
     },
     errorText: {
         color: 'red',
         textAlign: 'center',
         marginBottom: 10,
     }
});
