import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Ionicons from '@react-native-vector-icons/ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoginWithPhone } from '@/lib/features/useLedgerApi';

export default function LoginScreen() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']); // Changed to 4 boxes
  const [step, setStep] = useState<'PHONE' | 'OTP'>('PHONE');
  const [serverUserId, setServerUserId] = useState<number | null>(null);

  // Refs for the 4 OTP input boxes
  const inputRefs = useRef<Array<TextInput | null>>([]);

  // React Query login mutation hook
  const loginMutation = useLoginWithPhone();

  // Step 1: Send Request to Backend to Generate/Trigger Mock OTP
  const handleSendOtp = () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }

    loginMutation.mutate(phoneNumber, {
      onSuccess: (data) => {
        setServerUserId(data.userId);
        setStep('OTP');
      },
      onError: (error) => {
        console.error('Login failed:', error);
        alert('Failed to send OTP. Please check your backend connection.');
      },
    });
  };

  // Handle input change inside 4 individual boxes
  const handleOtpChange = (text: string, index: number) => {
    if (text.length > 1) {
      const pastedDigits = text.slice(0, 4).split('');
      const newOtp = [...otp];
      pastedDigits.forEach((digit, i) => {
        newOtp[i] = digit;
      });
      setOtp(newOtp);
      const nextIndex = Math.min(pastedDigits.length, 3);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    if (text !== '' && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle backspace navigation between boxes
  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && otp[index] === '' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Step 2: Verify OTP & Save Auth to AsyncStorage
  const handleVerifyOtp = async () => {
    const fullOtp = otp.join('');
    if (fullOtp.length < 4) {
      alert('Please enter the complete 4-digit OTP');
      return;
    }

    try {
      await AsyncStorage.setItem('is_logged_in', 'true');
      await AsyncStorage.setItem('userID', serverUserId ? serverUserId.toString() : '1');
      await AsyncStorage.setItem('phone_number', phoneNumber);

      router.replace('/');
    } catch (error) {
      console.error('Failed to save auth state', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.contentContainer}>
          {/* Header Icon Badge */}
          <View style={styles.iconRing}>
            <View style={styles.iconContainer}>
              <Ionicons name="wallet-outline" size={40} color="#0F172A" />
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={styles.title}>Welcome to MiniLedger</Text>
          <Text style={styles.subtitle}>
            {step === 'PHONE'
              ? 'Enter your phone number to sign in or register instantly.'
              : `We've sent a 4-digit code to +91 ${phoneNumber}`}
          </Text>

          {/* Direct Input & Action Container */}
          <View style={styles.formContainer}>
            {step === 'PHONE' ? (
              <>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <View style={styles.inputRow}>
                  <View style={styles.prefixContainer}>
                    <Text style={styles.prefixText}>+91</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter 10-digit number"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleSendOtp}
                  activeOpacity={0.85}
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <ActivityIndicator color="#0F172A" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Continue</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Enter 4-Digit OTP</Text>

                {/* 4 Individual OTP Boxes */}
                <View style={styles.otpBoxesContainer}>
                  {otp.map((digit, index) => (
                    <TextInput
                      key={index}
                      ref={(ref) => (inputRefs.current[index] = ref)}
                      style={[
                        styles.otpBox,
                        digit ? styles.otpBoxFilled : null,
                      ]}
                      keyboardType="number-pad"
                      maxLength={index === 0 ? 4 : 1}
                      value={digit}
                      onChangeText={(text) => handleOtpChange(text, index)}
                      onKeyPress={(e) => handleKeyPress(e, index)}
                      selectTextOnFocus
                    />
                  ))}
                </View>

                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={handleVerifyOtp}
                  activeOpacity={0.85}
                >
                  <Text style={styles.primaryButtonText}>Verify & Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setStep('PHONE');
                    setOtp(['', '', '', '']);
                  }}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>Change Phone Number</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {/* Footer Note */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Mock OTP will be printed in your backend server console log.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 24,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40,
  },
  iconRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#E9F9D2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#BEF264',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#BEF264',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    overflow: 'hidden',
  },
  prefixContainer: {
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRightWidth: 1,
    borderRightColor: '#E2E8F0',
  },
  prefixText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  otpBoxesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
    paddingHorizontal: 20, // Adds nice spacing for 4 boxes
  },
  otpBox: {
    width: 60, // Slightly wider for 4 boxes layout
    height: 60,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  otpBoxFilled: {
    borderColor: '#BEF264',
    backgroundColor: '#FAFEE8',
  },
  primaryButton: {
    backgroundColor: '#BEF264',
    borderRadius: 14,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  backButton: {
    marginTop: 14,
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
});