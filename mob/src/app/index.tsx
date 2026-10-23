import React, { useState, useEffect } from 'react';
import { View, Text, StatusBar, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useGetLoans, useGetSummary } from '@/lib/features/useLedgerApi';

const getInitials = (name: string) => {
  if (!name) return '??';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

export default function Index() {
  const [activeTab, setActiveTab] = useState('All');
  const [userId, setUserId] = useState<string | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  // Check login state and fetch userId on mount
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const isLoggedIn = await AsyncStorage.getItem('is_logged_in');
        const storedUserId = await AsyncStorage.getItem('userID');

        if (isLoggedIn !== 'true' || !storedUserId) {
          router.replace('/login');
        } else {
          setUserId(storedUserId);
        }
      } catch (error) {
        console.error('Failed to check auth status from AsyncStorage', error);
        router.replace('/login');
      } finally {
        setIsCheckingAuth(false);
      }
    };

    checkLoginStatus();
  }, []);

  // Fetch live loans & summary dynamically tied to the authenticated user ID
  const { data: loans = [], isLoading: loadingLoans, refetch: refetchLoans } = useGetLoans(userId);
  const { data: summary, isLoading: loadingSummary, refetch: refetchSummary } = useGetSummary(userId);

  const todayStr = new Date().toISOString().split('T')[0];

  const processedLoans = loans.map((loan) => {
    let computedStatus = loan.status;
    if (computedStatus === 'PENDING' && loan.dueDate < todayStr) {
      computedStatus = 'OVERDUE' as any;
    }
    return {
      ...loan,
      computedStatus,
      initials: getInitials(loan.friendName),
    };
  });

  const filteredLoans = processedLoans.filter((loan) => {
    if (activeTab === 'All') return true;
    return loan.computedStatus.toLowerCase() === activeTab.toLowerCase();
  });

  if (isCheckingAuth || (loadingLoans && loadingSummary)) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#0F172A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />

      {/* Navbar */}
      <View style={styles.navbar}>
        <View style={styles.logoTitleContainer}>
          <View style={styles.iconBadge}>
            <Image 
              source={require('@/assets/my/wallet.png')} 
              style={styles.walletIcon} 
            />
          </View>
          <Text style={styles.appTitle}>MiniLedger</Text>
        </View>

        <TouchableOpacity style={styles.profileButton} activeOpacity={0.8} onPress={() => router.push('/settings')}>
          <Ionicons name="person" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Dashboard Section */}
        <View style={styles.dashboardContainer}>
          {/* Hero Summary Card */}
          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroLabel}>Total Outstanding</Text>
              <Text style={styles.heroAmount}>
                ₹ {summary ? (summary.totalLent - summary.totalRepaid).toLocaleString('en-IN') : '0'}
              </Text>
            </View>

            <View style={styles.subInfoBadge}>
              <Ionicons name="paper-plane" size={14} color="#0F172A" style={styles.badgeIcon} />
              <Text style={styles.subInfoText}>Across {loans.length} active loans</Text>
            </View>
          </View>

          {/* 3-Column Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Lent</Text>
              <Text style={styles.statAmountLent}>
                ₹ {summary ? summary.totalLent.toLocaleString('en-IN') : '0'}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Repaid</Text>
              <Text style={styles.statAmountRepaid}>
                ₹ {summary ? summary.totalRepaid.toLocaleString('en-IN') : '0'}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Overdue</Text>
              <Text style={styles.statAmountDue}>
                ₹ {summary ? summary.overdueAmount.toLocaleString('en-IN') : '0'}
              </Text>
            </View>
          </View>

          {/* Add New Loan Button */}
          <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={() => router.push('/addloan')}>
            <Ionicons name="add" size={20} color="#0F172A" style={styles.addButtonIcon} />
            <Text style={styles.addButtonText}>Add New Loan</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Loans Header & Search */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitle}>Your Loans</Text>
          <TouchableOpacity 
            style={styles.searchIconButton} 
            activeOpacity={0.8}
            onPress={() => {
              refetchLoans();
              refetchSummary();
            }}
          >
            <Ionicons name="reload" size={16} color="#0F172A" />
          </TouchableOpacity>
        </View>

        {/* Categories / Filter Pills */}
        <View style={styles.categoriesContainer}>
          {['All', 'Pending', 'Overdue', 'Repaid'].map((tab) => {
            const isActive = activeTab.toLowerCase() === tab.toLowerCase();
            return (
              <TouchableOpacity
                key={tab}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.8}
              >
                <Text style={[styles.categoryText, isActive && styles.categoryTextActive]}>
                  {tab}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Loan List */}
        <View style={styles.listContainer}>
          {filteredLoans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No loan records found.</Text>
            </View>
          ) : (
            filteredLoans.map((loan) => {
              const isOverdue = loan.computedStatus === 'OVERDUE';
              const isPending = loan.computedStatus === 'PENDING';
              const isRepaid = loan.computedStatus === 'REPAID';

              return (
                <TouchableOpacity
                  key={loan.id}
                  style={[styles.loanCard, isOverdue && styles.overdueLoanCard]}
                  activeOpacity={0.9}
                  onPress={() => router.push({ pathname: '/person', params: { id: loan.id } })}
                >
                  <View style={styles.cardLeft}>
                    <View style={[styles.avatar, isOverdue && styles.overdueAvatar]}>
                      <Text style={[styles.avatarText, isOverdue && styles.overdueAvatarText]}>
                        {loan.initials}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.friendName}>{loan.friendName}</Text>
                      <Text style={styles.dueDate}>Due {loan.dueDate}</Text>
                    </View>
                  </View>

                  <View style={styles.cardRight}>
                    <Text style={styles.loanAmount}>₹ {Number(loan.amount).toLocaleString('en-IN')}</Text>
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
                        {loan.computedStatus}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  scrollContent: { paddingBottom: 30 },
  navbar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingVertical: 12, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  logoTitleContainer: { flexDirection: 'row', alignItems: 'center' },
  iconBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#BEF264', padding: 6, borderRadius: 10, marginRight: 10 },
  walletIcon: { width: 20, height: 20 },
  appTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', letterSpacing: -0.5 },
  profileButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center' },
  dashboardContainer: { paddingHorizontal: 18, paddingTop: 12 },
  heroCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 20, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 5 },
  heroLabel: { color: '#64748B', fontSize: 12, fontWeight: '700', letterSpacing: 0.8, textTransform: 'uppercase' },
  heroAmount: { color: '#0F172A', fontSize: 32, fontWeight: 'bold', marginTop: 4 },
  subInfoBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#def8b2', alignSelf: 'flex-start', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, marginTop: 14 },
  badgeIcon: { marginRight: 6 },
  subInfoText: { color: '#0F172A', fontSize: 12, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'flex-start', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 2 },
  statLabel: { fontSize: 10, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', marginBottom: 4 },
  statAmountLent: { fontSize: 14, fontWeight: 'bold', color: '#0F172A' },
  statAmountRepaid: { fontSize: 14, fontWeight: '800', color: '#059669' },
  statAmountDue: { fontSize: 14, fontWeight: '800', color: '#DC2626' },
  addButton: { flexDirection: 'row', backgroundColor: '#BEF264', borderRadius: 14, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', marginTop: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
  addButtonIcon: { marginRight: 6 },
  addButtonText: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  sectionHeaderContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, marginTop: 18, marginBottom: 10 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#0F172A' },
  searchIconButton: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', justifyContent: 'center', alignItems: 'center' },
  categoriesContainer: { flexDirection: 'row', paddingHorizontal: 18, gap: 8 },
  categoryPill: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 30, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' },
  categoryPillActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  categoryText: { fontSize: 13, fontWeight: '700', color: '#64748B' },
  categoryTextActive: { color: '#FFFFFF' },
  listContainer: { paddingHorizontal: 18, marginTop: 14, gap: 10 },
  emptyContainer: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  loanCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.02, shadowRadius: 4, elevation: 2 },
  overdueLoanCard: { borderColor: '#FCA5A5', backgroundColor: '#FFF8F8' },
  cardLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  overdueAvatar: { backgroundColor: '#FEE2E2' },
  overdueAvatarText: { color: '#DC2626' },
  friendName: { fontSize: 15, fontWeight: '700', color: '#0F172A' },
  dueDate: { fontSize: 12, color: '#64748B', marginTop: 2 },
  cardRight: { alignItems: 'flex-end' },
  loanAmount: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  overdueBadge: { backgroundColor: '#FEF2F2' },
  overdueBadgeText: { color: '#DC2626' },
  pendingBadge: { backgroundColor: '#EEF2FF' },
  pendingBadgeText: { color: '#4F46E5' },
  repaidBadge: { backgroundColor: '#ECFDF5' },
  repaidBadgeText: { color: '#059669' },
});