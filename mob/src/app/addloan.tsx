import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCreateLoan } from '@/lib/features/useLedgerApi'; // Adjust path to your hook file

export default function AddLoanScreen() {
  const router = useRouter();
  const createLoanMutation = useCreateLoan();

  // Form State
  const [friendName, setFriendName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Fetch logged-in user ID from AsyncStorage on mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const storedUserId = await AsyncStorage.getItem('userID');
        if (storedUserId) {
          setUserId(parseInt(storedUserId, 10));
        }
      } catch (error) {
        console.error('Failed to retrieve user ID from storage', error);
      }
    };
    fetchUserId();
  }, []);

  // Handle Date Change from Picker
  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDueDate(selectedDate);
    }
  };

  // Format Date for Display (YYYY-MM-DD)
  const formattedDate = dueDate.toISOString().split('T')[0];

  // Pick Image Function
  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], // Updated from ImagePicker.MediaTypeOptions.Images
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0].uri) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Remove Selected Image
  const removeImage = () => {
    setImageUri(null);
  };

  // Submit via React Query Mutation
  const handleSubmit = () => {
    if (!friendName || !amount) {
      alert('Please fill in Friend Name and Amount');
      return;
    }

    if (!userId) {
      alert('User session not found. Please log in again.');
      router.replace('/login');
      return;
    }

    // Create FormData for multipart file upload
    const formData = new FormData();
    formData.append('userId', userId.toString());
    formData.append('friendName', friendName);
    formData.append('amount', amount);
    formData.append('dueDate', formattedDate);
    if (notes) formData.append('reason', notes);

    // Append image file if user selected one
    if (imageUri) {
      const filename = imageUri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // React Native FormData file structure
      formData.append('receipt', {
        uri: imageUri,
        name: filename,
        type: type,
      } as any);
    }

    createLoanMutation.mutate(formData as any, {
      onSuccess: () => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/');
        }
      },
      onError: (error) => {
        console.error('Failed to create loan entry:', error);
        alert('Failed to save loan entry. Please check your backend server.');
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Loan Entry</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Scrollable Form Content */}
        <ScrollView
          contentContainerStyle={styles.formContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Friend Name Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Borrower / Friend's Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons
                name="person-outline"
                size={18}
                color="#64748B"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Ayan Khan"
                placeholderTextColor="#94A3B8"
                value={friendName}
                onChangeText={setFriendName}
              />
            </View>
          </View>

          {/* Amount Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Amount (₹)</Text>
            <View style={styles.inputWrapper}>
              <Text style={styles.currencyPrefix}>₹</Text>
              <TextInput
                style={styles.textInput}
                placeholder="0.00"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
            </View>
          </View>

          {/* Due Date Picker Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Due Date</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowDatePicker(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="calendar-outline"
                size={18}
                color="#64748B"
                style={styles.inputIcon}
              />
              <Text style={[styles.textInput, { lineHeight: 50 }]}>
                {formattedDate}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#64748B" />
            </TouchableOpacity>

            {/* Native Date Picker Component */}
            {showDatePicker && (
              <DateTimePicker
                value={dueDate}
                mode="date"
                display="default"
                minimumDate={new Date()} // Disables all past dates
                onChange={onDateChange}
              />
            )}
          </View>

          {/* Notes / Reason Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Notes / Reason (Optional)</Text>
            <View style={[styles.inputWrapper, styles.multilineWrapper]}>
              <TextInput
                style={[styles.textInput, styles.multilineInput]}
                placeholder="e.g. Dinner bill split, trip expense..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </View>

          {/* Image / Receipt Picker Field */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Attach Receipt / Proof (Optional)</Text>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={removeImage}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.uploadBox}
                onPress={pickImage}
                activeOpacity={0.8}
              >
                <Ionicons name="camera-outline" size={24} color="#64748B" />
                <Text style={styles.uploadText}>Upload Screenshot or Receipt</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>

        {/* Sticky Footer Button at Bottom */}
        <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            activeOpacity={0.85}
            disabled={createLoanMutation.isPending}
          >
            {createLoanMutation.isPending ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color="#0F172A"
                  style={styles.submitIcon}
                />
                <Text style={styles.submitButtonText}>Save Loan</Text>
              </>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  formContainer: {
    padding: 18,
    paddingBottom: 40,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  multilineWrapper: {
    height: 90,
    alignItems: 'flex-start',
    paddingVertical: 10,
  },
  multilineInput: {
    textAlignVertical: 'top',
  },
  uploadBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  uploadText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  imagePreviewContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#0F172A',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingTop: 12,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 5,
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: '#BEF264',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  submitIcon: {
    marginRight: 8,
  },
  submitButtonText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
});