import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useAppDispatch, useAppSelector } from '@/lib/hooks';
import { increment } from '@/lib/features/counter';

export default function Success() {
  const router = useRouter();

  const value = useAppSelector((state) => state.counter.count);

  const dispatch = useAppDispatch();

  const handleDone = () => {
    // Navigate back or to the home/dashboard screen
    router.dismissAll ? router.dismissAll() : router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <View style={styles.contentContainer}>
        {/* Success Icon Badge */}
        <View style={styles.iconRing}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark" size={44} color="#0F172A" />
          </View>
        </View>

        {/* Heading & Subtitle */}
        <Text style={styles.title}>Successfully Marked as Repaid!</Text>
        <Text style={styles.subtitle}>
          The transaction has been updated successfully and recorded in your history.
        </Text>

        {/* Summary Receipt Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Status</Text>
            <View style={styles.successBadge}>
              <Text style={styles.successBadgeText}>REPAID</Text>
            </View>
          </View>
          
          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Transaction Type</Text>
            <Text style={styles.summaryValue}>Loan Settlement</Text>
          </View>
        </View>
      </View>

      {/* Sticky Bottom Action Footer */}
      <View style={styles.footerContainer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={handleDone}
          activeOpacity={0.85}
        >
          <Text style={styles.doneButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'space-between',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -40, // Optical centering adjustment
  },
  iconRing: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E9F9D2', // Softer tint of lime
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
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
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 12,
  },
  summaryCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  successBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  successBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  footerContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 10,
  },
  doneButton: {
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
  doneButtonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
});