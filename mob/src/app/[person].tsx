import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useGetLoanDetails, useMarkAsRepaid } from '@/lib/features/useLedgerApi';
import { API_URL } from '@/constants/api';

// Helper to extract initials from name
const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

const getReceiptImageUrl = (url?: string | null) => {
  if (!url) return null;
  // If it's already an absolute URL or local file URI, return it as-is
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('file://')) {
    return url;
  }
  // Otherwise, prepend the backend base url to the relative path
  return `${API_URL}${url}`;
};

export default function Person() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Fetch individual loan details using React Query
  const { data: loan, isLoading, error } = useGetLoanDetails(id);
  const markAsRepaidMutation = useMarkAsRepaid();

  const handleMarkAsRepaid = () => {
    if (!id) return;

    markAsRepaidMutation.mutate(id, {
      onSuccess: () => {
        router.push('/success');
      },
      onError: (err) => {
        console.error('Failed to mark loan as repaid:', err);
        alert('Failed to update loan status. Please try again.');
      },
    });
  };

  // Show loading spinner while fetching
  if (isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  // Handle error or missing loan
  if (error || !loan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loaderContainer}>
          <Text style={styles.errorText}>Loan entry not found or failed to load.</Text>
          <TouchableOpacity style={styles.backButtonGeneric} onPress={() => router.back()}>
            <Text style={styles.backButtonGenericText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Compute status (Overdue vs Pending vs Repaid)
  const todayStr = new Date().toISOString().split('T')[0];
  let computedStatus = loan.status; // 'PENDING' | 'REPAID'
  if (computedStatus === 'PENDING' && loan.dueDate < todayStr) {
    computedStatus = 'OVERDUE' as any;
  }

  const isOverdue = computedStatus === 'OVERDUE';
  const isPending = computedStatus === 'PENDING';
  const isRepaid = computedStatus === 'REPAID';

  // Helper values for status icon and color
  const getStatusConfig = () => {
    if (isOverdue) return { icon: 'alert-circle-outline', text: 'Overdue', color: '#DC2626', bg: '#FEF2F2' };
    if (isRepaid) return { icon: 'checkmark-circle-outline', text: 'Repaid', color: '#059669', bg: '#ECFDF5' };
    return { icon: 'time-outline', text: 'Pending', color: '#4F46E5', bg: '#EEF2FF' };
  };

  const statusConfig = getStatusConfig();

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Loan Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollContent}
      >
        {/* Borrower Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarLargeText}>{getInitials(loan.friendName)}</Text>
          </View>
          <Text style={styles.personName}>{loan.friendName}</Text>
          
          {/* Status Badge below name with small icon */}
          <View style={[styles.profileStatusBadge, { backgroundColor: statusConfig.bg }]}>
            <Ionicons name={statusConfig.icon as any} size={14} color={statusConfig.color} style={styles.profileStatusIcon} />
            <Text style={[styles.profileStatusText, { color: statusConfig.color }]}>
              {statusConfig.text}
            </Text>
          </View>
        </View>

        {/* Hero Bill Summary Card */}
        <View style={[styles.heroCard, isOverdue && styles.overdueHeroCard]}>
          <View style={styles.heroTopRow}>
            <Text style={styles.heroLabel}>Outstanding Amount</Text>
            <View
              style={[
                styles.statusBadge,
                isOverdue && styles.overdueBadge,
                isPending && styles.pendingBadge,
                isRepaid && styles.repaidBadge,
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  isOverdue && styles.overdueBadgeText,
                  isPending && styles.pendingBadgeText,
                  isRepaid && styles.repaidBadgeText,
                ]}
              >
                {computedStatus}
              </Text>
            </View>
          </View>

          <Text style={styles.heroAmount}>₹ {Number(loan.amount).toLocaleString('en-IN')}</Text>

          <View style={styles.divider} />

          {/* Details Grid */}
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="receipt-outline" size={18} color="#475569" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Reason / Note</Text>
                <Text style={styles.detailValue}>{loan.reason || 'No additional notes provided'}</Text>
              </View>
            </View>

            <View style={styles.detailItem}>
              <View style={styles.iconContainer}>
                <Ionicons name="calendar-outline" size={18} color="#475569" />
              </View>
              <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>Due Date</Text>
                <Text style={styles.detailValue}>{loan.dueDate}</Text>
              </View>
            </View>
          </View>

          {/* Optional Receipt Preview */}
          {loan.receiptUrl && (
            <View style={styles.receiptContainer}>
              <Text style={styles.detailLabel}>Attached Receipt</Text>
              <Image 
                source={{ uri: getReceiptImageUrl(loan.receiptUrl)! }} 
                style={styles.receiptImage} 
              />
            </View>
          )}
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Footer */}
      {!isRepaid && (
        <SafeAreaView edges={['bottom']} style={styles.footerContainer}>
          <TouchableOpacity
            style={styles.repaidActionButton}
            onPress={handleMarkAsRepaid}
            activeOpacity={0.85}
            disabled={markAsRepaidMutation.isPending}
          >
            {markAsRepaidMutation.isPending ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="#0F172A" style={styles.actionIcon} />
                <Text style={styles.repaidActionText}>Mark as Repaid</Text>
              </>
            )}
          </TouchableOpacity>
        </SafeAreaView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
  },
  backButtonGeneric: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonGenericText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarLarge: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#BEF264',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLargeText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  personName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  profileStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  profileStatusIcon: {
    marginRight: 4,
  },
  profileStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  overdueHeroCard: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FFFBFB',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  heroAmount: {
    color: '#0F172A',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  detailRow: {
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailTextContainer: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  receiptContainer: {
    marginTop: 16,
  },
  receiptImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  footerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20, // <--- ADD THIS to lift the button above the phone's bottom edge
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 10,
  },
  repaidActionButton: {
    flexDirection: 'row',
    backgroundColor: '#BEF264',
    borderRadius: 14,
    paddingVertical: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    marginRight: 8,
  },
  repaidActionText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  overdueBadge: {
    backgroundColor: '#FEF2F2',
  },
  overdueBadgeText: {
    color: '#DC2626',
  },
  pendingBadge: {
    backgroundColor: '#EEF2FF',
  },
  pendingBadgeText: {
    color: '#4F46E5',
  },
  repaidBadge: {
    backgroundColor: '#ECFDF5',
  },
  repaidBadgeText: {
    color: '#059669',
  },
});