import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import { employeeApi } from '../../../services/employee.api';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../components/ui/Toast';
import { useAppTheme } from '../../../context/ThemeContext';
import { colors } from '../../../styles/colors';
import { spacing, radius } from '../../../styles/spacing';

/**
 * EXACT WORKAXIS PRICING STRUCTURE (Single Source of Truth)
 * 1. FREE     : Up to 20 employees  → ₹0
 * 2. STARTER  : 21–50 employees     → ₹20
 * 3. BUSINESS : 51–100 employees    → ₹40
 * 4. GROWTH   : 101–250 employees   → ₹100
 */
export const WORKAXIS_PLANS = [
  {
    id: 'free',
    name: 'FREE',
    shortDesc: 'For small teams getting started.',
    employeeRange: 'Up to 20 Employees',
    minEmployees: 0,
    maxEmployees: 20,
    price: 0,
    priceDisplay: '₹0',
    billingNote: 'Free',
    benefits: [
      'Employee Management',
      'Team Management',
      'Attendance',
      'Attendance History',
    ],
  },
  {
    id: 'starter',
    name: 'STARTER',
    shortDesc: 'For growing teams.',
    employeeRange: '21–50 Employees',
    minEmployees: 21,
    maxEmployees: 50,
    price: 20,
    priceDisplay: '₹20',
    billingNote: 'Per billing period',
    benefits: [
      'Everything in Free',
      'Leave Management',
      'Basic Reports',
      'Priority Email Support',
    ],
  },
  {
    id: 'business',
    name: 'BUSINESS',
    shortDesc: 'For established teams.',
    employeeRange: '51–100 Employees',
    minEmployees: 51,
    maxEmployees: 100,
    price: 40,
    priceDisplay: '₹40',
    billingNote: 'Per billing period',
    benefits: [
      'Everything in Starter',
      'Advanced Reports',
      'Department Management',
      'Automated Approvals',
    ],
  },
  {
    id: 'growth',
    name: 'GROWTH',
    shortDesc: 'For larger teams.',
    employeeRange: '101–250 Employees',
    minEmployees: 101,
    maxEmployees: 250,
    price: 100,
    priceDisplay: '₹100',
    billingNote: 'Per billing period',
    benefits: [
      'Everything in Business',
      'Audit Logs',
      'Multi-admin Permissions',
      '24/7 Priority Support',
    ],
  },
];

export default function SubscriptionPlansScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { theme, currentColors } = useAppTheme();
  const isDark = theme === 'dark';

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [employeeCount, setEmployeeCount] = useState(0);
  const [activePlanId, setActivePlanId] = useState('free');

  // Confirmation Modal State
  const [upgradeModal, setUpgradeModal] = useState({
    visible: false,
    targetPlan: null,
    isProcessing: false,
  });

  // Downgrade Block Modal State
  const [downgradeModal, setDowngradeModal] = useState({
    visible: false,
    targetPlan: null,
  });

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);
      const res = await employeeApi.getEmployees().catch((err) => {
        throw err;
      });

      const list = res?.data || [];
      const count = Array.isArray(list) ? list.length : 0;
      setEmployeeCount(count);

      // In real commercial SaaS, subscription is tied to company account.
      // Default to FREE unless set or persisted.
      setActivePlanId('free');
    } catch (err) {
      console.error('Failed to load subscription/employee data:', err);
      setLoadError('Unable to load your current subscription information.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Current Active Plan
  const currentPlan = useMemo(() => {
    return WORKAXIS_PLANS.find((p) => p.id === activePlanId) || WORKAXIS_PLANS[0];
  }, [activePlanId]);

  // Recommended Plan identification based on real employee usage
  const recommendedPlanId = useMemo(() => {
    if (employeeCount > currentPlan.maxEmployees) {
      // Find the tier that fits the employee count
      const fitting = WORKAXIS_PLANS.find((p) => p.maxEmployees >= employeeCount);
      return fitting ? fitting.id : 'growth';
    }
    if (employeeCount >= currentPlan.maxEmployees - 3 && currentPlan.id !== 'growth') {
      const nextIndex = WORKAXIS_PLANS.findIndex((p) => p.id === currentPlan.id) + 1;
      return WORKAXIS_PLANS[nextIndex]?.id || null;
    }
    return null;
  }, [employeeCount, currentPlan]);

  // Usage calculations
  const isLimitExceeded = employeeCount > currentPlan.maxEmployees;
  const isLimitReached = employeeCount === currentPlan.maxEmployees;
  const remainingSlots = Math.max(0, currentPlan.maxEmployees - employeeCount);
  const usagePercentage = Math.min(100, Math.round((employeeCount / currentPlan.maxEmployees) * 100));

  const handlePlanSelect = (targetPlan) => {
    if (targetPlan.id === activePlanId) return;

    // Check Downgrade Protection: If company already has more employees than target plan max
    if (employeeCount > targetPlan.maxEmployees) {
      setDowngradeModal({
        visible: true,
        targetPlan,
      });
      return;
    }

    // Open clean upgrade confirmation modal
    setUpgradeModal({
      visible: true,
      targetPlan,
      isProcessing: false,
    });
  };

  const handleConfirmUpgrade = () => {
    if (!upgradeModal.targetPlan) return;
    setUpgradeModal((prev) => ({ ...prev, isProcessing: true }));

    setTimeout(() => {
      const newPlan = upgradeModal.targetPlan;
      setActivePlanId(newPlan.id);
      setUpgradeModal({ visible: false, targetPlan: null, isProcessing: false });
      toast.show(`✓ Plan updated to ${newPlan.name} successfully`, 'success');
    }, 700);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? currentColors.background : '#F8FAFC' }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.skeletonContainer}>
          <View style={styles.skeletonCard} />
          <View style={styles.skeletonCardSmall} />
          <View style={styles.skeletonCard} />
        </View>
      </SafeAreaView>
    );
  }

  if (loadError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? currentColors.background : '#F8FAFC' }]}>
        <View style={styles.headerBar}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Subscription</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.errorContainer}>
          <MaterialIcons name="error-outline" size={48} color={colors.error} />
          <Text style={styles.errorTitle}>Subscription information unavailable</Text>
          <Text style={styles.errorSubtitle}>Unable to load your current plan.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadData}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? currentColors.background : '#F8FAFC' }]}>
      {/* 1. Mobile Screen Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Subscription</Text>
          <Text style={styles.headerSubtitle}>Manage your WorkAxis plan</Text>
        </View>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 2. Page Subtitle / Instructions */}
        <View style={styles.pageSubHeader}>
          <Text style={styles.supportingText}>
            Choose a plan based on your workforce size.
          </Text>
        </View>

        {/* 3. CURRENT PLAN CARD (Primary Focus) */}
        <View style={[styles.currentPlanCard, isLimitExceeded && styles.currentPlanCardExceeded]}>
          <View style={styles.cardTopRow}>
            <View>
              <Text style={styles.currentPlanPreTitle}>Current Plan</Text>
              <Text style={styles.currentPlanName}>{currentPlan.name}</Text>
            </View>
            <View style={styles.currentPriceBadge}>
              <Text style={styles.currentPriceText}>{currentPlan.priceDisplay}</Text>
              <Text style={styles.currentPriceNote}>{currentPlan.billingNote}</Text>
            </View>
          </View>

          {/* Usage Stats Block */}
          <View style={styles.usageBlock}>
            <View style={styles.usageHeader}>
              <Text style={styles.usageLabel}>Employees</Text>
              <Text style={[styles.usageNumbers, isLimitExceeded && { color: colors.error }]}>
                {employeeCount} / {currentPlan.maxEmployees}
              </Text>
            </View>

            {/* Clean Clamped Progress Bar */}
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${usagePercentage}%` },
                  isLimitExceeded && styles.progressBarExceeded,
                ]}
              />
            </View>

            {/* Dynamic Status / Warning Row */}
            {isLimitExceeded ? (
              <View style={styles.limitBannerExceeded}>
                <MaterialIcons name="warning" size={16} color="#B91C1C" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.limitTitleExceeded}>Limit exceeded</Text>
                  <Text style={styles.limitTextExceeded}>
                    {employeeCount} employees · Plan limit: {currentPlan.maxEmployees}. Upgrade required to add additional employees.
                  </Text>
                </View>
              </View>
            ) : isLimitReached ? (
              <View style={styles.limitBannerReached}>
                <MaterialIcons name="info" size={16} color="#B45309" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.limitTitleReached}>Employee limit reached</Text>
                  <Text style={styles.limitTextReached}>
                    You’ve reached the employee limit for your current plan.
                  </Text>
                </View>
              </View>
            ) : remainingSlots <= 3 ? (
              <View style={styles.limitBannerWarning}>
                <MaterialIcons name="info-outline" size={15} color="#B45309" />
                <Text style={styles.limitTextWarning}>
                  {remainingSlots} employee {remainingSlots === 1 ? 'slot' : 'slots'} remaining
                </Text>
              </View>
            ) : (
              <Text style={styles.slotsRemainingText}>
                {employeeCount} of {currentPlan.maxEmployees} employees used · {remainingSlots} slots remaining
              </Text>
            )}
          </View>

          {/* Clean Plan Metadata Grid */}
          <View style={styles.metadataGrid}>
            <View style={styles.metadataItem}>
              <Text style={styles.metaLabel}>Plan:</Text>
              <Text style={styles.metaValue}>{currentPlan.name}</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metaLabel}>Employee Limit:</Text>
              <Text style={styles.metaValue}>{currentPlan.maxEmployees} Employees</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metaLabel}>Current Usage:</Text>
              <Text style={styles.metaValue}>{employeeCount} Employees</Text>
            </View>
            <View style={styles.metadataItem}>
              <Text style={styles.metaLabel}>Remaining:</Text>
              <Text style={[styles.metaValue, isLimitExceeded && { color: colors.error, fontWeight: '700' }]}>
                {isLimitExceeded ? `Exceeded by ${employeeCount - currentPlan.maxEmployees}` : `${remainingSlots} Employees`}
              </Text>
            </View>
          </View>

          {isLimitExceeded && (
            <TouchableOpacity
              style={styles.upgradeNowCta}
              activeOpacity={0.85}
              onPress={() => {
                const growth = WORKAXIS_PLANS.find((p) => p.id === 'growth');
                if (growth) handlePlanSelect(growth);
              }}
            >
              <Text style={styles.upgradeNowText}>View Upgrade Options</Text>
              <MaterialIcons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {/* 4. AVAILABLE PLANS SECTION */}
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>Available Plans</Text>
          <Text style={styles.sectionSubtitle}>Select the right tier for your team</Text>
        </View>

        {/* 5. PRICING CARDS LIST */}
        <View style={styles.plansContainer}>
          {WORKAXIS_PLANS.map((plan) => {
            const isCurrent = plan.id === activePlanId;
            const isRecommended = plan.id === recommendedPlanId && !isCurrent;

            return (
              <View
                key={plan.id}
                style={[
                  styles.planCard,
                  isCurrent && styles.planCardCurrent,
                  isRecommended && styles.planCardRecommended,
                ]}
              >
                {/* Badges Row: Current Plan or Recommended */}
                <View style={styles.cardBadgeRow}>
                  <Text style={styles.planCardName}>{plan.name}</Text>
                  {isCurrent && (
                    <View style={styles.badgeCurrent}>
                      <View style={styles.badgeDot} />
                      <Text style={styles.badgeCurrentText}>CURRENT PLAN</Text>
                    </View>
                  )}
                  {isRecommended && (
                    <View style={styles.badgeRecommended}>
                      <Text style={styles.badgeRecommendedText}>RECOMMENDED</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.planCardShortDesc}>{plan.shortDesc}</Text>

                {/* Employee Range */}
                <View style={styles.rangeRow}>
                  <MaterialIcons name="groups" size={15} color="#1A365D" />
                  <Text style={styles.rangeText}>{plan.employeeRange}</Text>
                </View>

                {/* Price Display */}
                <View style={styles.priceRow}>
                  <Text style={styles.priceAmount}>{plan.priceDisplay}</Text>
                  <Text style={styles.priceNote}>{plan.billingNote}</Text>
                </View>

                {isRecommended && (
                  <View style={styles.recommendedNoteBanner}>
                    <MaterialIcons name="thumb-up-alt" size={13} color="#1A365D" />
                    <Text style={styles.recommendedNoteText}>Recommended for your team</Text>
                  </View>
                )}

                <View style={styles.cardDivider} />

                {/* Benefits List */}
                <View style={styles.benefitsList}>
                  {plan.benefits.map((benefit, idx) => (
                    <View key={idx} style={styles.benefitItem}>
                      <MaterialIcons name="check" size={15} color="#10B981" style={{ marginRight: 6 }} />
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>

                {/* Action Button */}
                <View style={styles.btnWrap}>
                  {isCurrent ? (
                    <View style={styles.disabledCurrentBtn}>
                      <Text style={styles.disabledCurrentBtnText}>Current Plan</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={[
                        styles.upgradeBtn,
                        isRecommended && styles.upgradeBtnRecommended,
                      ]}
                      activeOpacity={0.85}
                      onPress={() => handlePlanSelect(plan)}
                    >
                      <Text style={styles.upgradeBtnText}>
                        {plan.price === 0 ? 'Switch to Free' : `Upgrade to ${plan.name}`}
                      </Text>
                      <MaterialIcons name="chevron-right" size={18} color="#FFFFFF" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* 6. UPGRADE CONFIRMATION IN-APP MODAL */}
      <Modal
        visible={upgradeModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          if (!upgradeModal.isProcessing) {
            setUpgradeModal({ visible: false, targetPlan: null, isProcessing: false });
          }
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <MaterialIcons name="upgrade" size={26} color="#1A365D" />
            </View>

            <Text style={styles.modalTitle}>
              Upgrade to {upgradeModal.targetPlan?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Your new plan supports up to {upgradeModal.targetPlan?.maxEmployees} employees.
            </Text>

            <View style={styles.planSummaryList}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Current plan:</Text>
                <Text style={styles.summaryVal}>{currentPlan.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>New plan:</Text>
                <Text style={[styles.summaryVal, { fontWeight: '700', color: '#1A365D' }]}>
                  {upgradeModal.targetPlan?.name}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Employee limit:</Text>
                <Text style={styles.summaryVal}>
                  {upgradeModal.targetPlan?.maxEmployees}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Price:</Text>
                <Text style={[styles.summaryVal, { fontWeight: '700', color: '#0F172A' }]}>
                  {upgradeModal.targetPlan?.priceDisplay}
                </Text>
              </View>
            </View>

            <View style={styles.modalActionButtons}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                activeOpacity={0.7}
                disabled={upgradeModal.isProcessing}
                onPress={() => setUpgradeModal({ visible: false, targetPlan: null, isProcessing: false })}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalContinueBtn}
                activeOpacity={0.85}
                disabled={upgradeModal.isProcessing}
                onPress={handleConfirmUpgrade}
              >
                {upgradeModal.isProcessing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalContinueText}>Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 9. DOWNGRADE PROTECTION IN-APP MODAL */}
      <Modal
        visible={downgradeModal.visible}
        transparent
        animationType="fade"
        onRequestClose={() => setDowngradeModal({ visible: false, targetPlan: null })}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
              <MaterialIcons name="block" size={26} color={colors.error} />
            </View>

            <Text style={styles.modalTitle}>Downgrade unavailable</Text>
            <Text style={styles.modalBodyWarning}>
              Your company currently has{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>{employeeCount} employees</Text>.
              {'\n'}This plan supports up to{' '}
              <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                {downgradeModal.targetPlan?.maxEmployees} employees
              </Text>.
            </Text>
            <Text style={styles.downgradeAdvice}>
              Choose a plan that supports your current workforce or reduce the employee count first.
            </Text>

            <TouchableOpacity
              style={styles.downgradeDismissBtn}
              activeOpacity={0.8}
              onPress={() => setDowngradeModal({ visible: false, targetPlan: null })}
            >
              <Text style={styles.downgradeDismissText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 90, // Clear mobile bottom tabs
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  pageSubHeader: {
    marginBottom: 12,
  },
  supportingText: {
    fontSize: 12,
    color: '#64748B',
  },
  currentPlanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 18,
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)' },
      default: { elevation: 1.5 },
    }),
  },
  currentPlanCardExceeded: {
    borderColor: '#FCA5A5',
    borderWidth: 1.5,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  currentPlanPreTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  currentPlanName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1A365D',
    marginTop: 1,
  },
  currentPriceBadge: {
    alignItems: 'flex-end',
  },
  currentPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  currentPriceNote: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  usageBlock: {
    marginBottom: 14,
  },
  usageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  usageLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  usageNumbers: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  progressBarTrack: {
    height: 7,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#1A365D',
    borderRadius: 4,
  },
  progressBarExceeded: {
    backgroundColor: '#EF4444',
  },
  slotsRemainingText: {
    fontSize: 11,
    color: '#64748B',
  },
  limitBannerExceeded: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    marginTop: 4,
  },
  limitTitleExceeded: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B91C1C',
  },
  limitTextExceeded: {
    fontSize: 11,
    color: '#991B1B',
    lineHeight: 16,
    marginTop: 1,
  },
  limitBannerReached: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    marginTop: 4,
  },
  limitTitleReached: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B45309',
  },
  limitTextReached: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 1,
  },
  limitBannerWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  limitTextWarning: {
    fontSize: 11,
    fontWeight: '600',
    color: '#B45309',
  },
  metadataGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  metadataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
  },
  upgradeNowCta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A365D',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
    gap: 6,
  },
  upgradeNowText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sectionHeaderWrap: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  plansContainer: {
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)' },
      default: { elevation: 1 },
    }),
  },
  planCardCurrent: {
    borderColor: '#1A365D',
    borderWidth: 1.5,
  },
  planCardRecommended: {
    borderColor: '#1A365D',
    borderWidth: 1.5,
  },
  cardBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  planCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  badgeCurrent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
    gap: 4,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#1A365D',
  },
  badgeCurrentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1A365D',
  },
  badgeRecommended: {
    backgroundColor: '#1A365D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeRecommendedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  planCardShortDesc: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  rangeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A365D',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  priceAmount: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  priceNote: {
    fontSize: 12,
    color: '#64748B',
  },
  recommendedNoteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26, 54, 93, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  recommendedNoteText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1A365D',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  benefitsList: {
    gap: 6,
    marginBottom: 14,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  benefitText: {
    fontSize: 12,
    color: '#334155',
  },
  btnWrap: {
    marginTop: 2,
  },
  disabledCurrentBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledCurrentBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A365D',
    paddingVertical: 11,
    borderRadius: 8,
    gap: 4,
  },
  upgradeBtnRecommended: {
    backgroundColor: '#1A365D',
  },
  upgradeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skeletonContainer: {
    padding: 16,
    gap: 14,
  },
  skeletonCard: {
    height: 140,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    opacity: 0.6,
  },
  skeletonCardSmall: {
    height: 90,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    opacity: 0.6,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryBtn: {
    backgroundColor: '#1A365D',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    width: '100%',
    maxWidth: 380,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(26, 54, 93, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 16,
  },
  modalBodyWarning: {
    fontSize: 13,
    color: '#334155',
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 6,
  },
  downgradeAdvice: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 18,
  },
  downgradeDismissBtn: {
    width: '100%',
    backgroundColor: '#1A365D',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  downgradeDismissText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planSummaryList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '600',
  },
  modalActionButtons: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  modalContinueBtn: {
    flex: 1,
    backgroundColor: '#1A365D',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalContinueText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
