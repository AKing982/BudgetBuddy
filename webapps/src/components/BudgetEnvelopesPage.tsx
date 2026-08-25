import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    alpha, Alert, Box, Button, Chip, CircularProgress, Container,
    Divider, Grid, Grow, IconButton, LinearProgress, Skeleton,
    Snackbar, Stack, Tooltip, Typography,
} from '@mui/material';
import {
    Plus, Target, Wallet, TrendingUp, CheckCircle, PauseCircle,
    Flame, MoreHorizontal, ArrowUpRight, Clock, Layers, BarChart2,
    Calendar, RefreshCcw, Calculator, Sparkles, CreditCard, Settings2,
    ChevronLeft, ChevronRight, AlertTriangle, PiggyBank, LayoutList, XCircle,
    Pencil, X as XIcon, Sliders,
} from 'lucide-react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
    PointElement, ArcElement, Filler, Tooltip as ChartTooltip, Legend,
} from 'chart.js';

import Sidebar from './Sidebar';
import CreateEnvelopeDialog, { NewEnvelopeForm } from './CreateEnvelopeDialog';
import MultiEnvelopeDashboard from './MultiEnvelopeDashboard';
import BudgetEnvelopeService, { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
import { EnvelopeCreateRequest, EnvelopeType, NewEnvelopeCriteria, ScheduledContribution } from '../config/Types';

import { BudgetEnvelope, EnvelopeContribution, PlanEntry, PlanResult, AffordabilityResult } from '../config/Types';
import { MAROON, MAROON_DARK, ENVELOPE_COLORS, ENVELOPE_TYPE_LABELS, STATUS_META, TYPE_ICONS, FREQUENCY_OPTIONS } from '../config/Constants';
import { fmt, daysUntil, progressPct, velocityDays, requiredMonthly, monthlyContributed, isEnvelopeActiveInMonth, urgencyScore, distributeAuto, computeResults, monthsBetween } from '../config/Helpers';
import { VelocityChip, PanelHeader, ContributionRow } from './Shared';
import EnvelopeLeftPanel, { LeftPanelView } from './EnvelopeLeftPanel';
import { ManualContributionDialog, AffordabilityDialog } from './Shared';
import EnvelopeDetailPanel from './EnvelopeDetailPanel';
import EnvelopeNotificationService from '../services/EnvelopeNotificationService';
import { EnvelopeNotification } from '../config/Types';
import PaymentPlanAdjuster from './PaymentPlanAdjuster';
import { NotificationPrefs, NotificationEventSettings, DEFAULT_NOTIFICATION_EVENT_SETTINGS } from './NotificationToggle';
import { NotificationsDialog } from './NotificationsDialog';
import {GoalUpdateValues} from "./GoalUpdateDialog";
import LinkedGoalUpdateDialog, { LinkedGoalUpdateValues } from './LinkedGoalUpdateDialog';
import envelopeNotificationService from "../services/EnvelopeNotificationService";


ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, ChartTooltip, Legend);

type EnvelopeMode   = 'single' | 'multi';

/** Default notification preferences applied to an envelope/group the first time it's seen */
const DEFAULT_NOTIF_PREFS: NotificationPrefs = { system: true, email: false };

/**
 * Linked groups and individual envelopes both live in the same id space from the
 * backend, so we mirror a group's master toggle under a negative key
 * (-groupId) to avoid ever colliding with a real envelope id.
 */
const groupNotifKey = (groupId: number) => -groupId;

const BudgetEnvelopesPage: React.FC = () => {
    // ── UI state ───────────────────────────────────────────────────────────────
    const [animateIn,    setAnimateIn]    = useState(false);
    const [isLoading,    setIsLoading]    = useState(false);
    const [envelopeMode, setEnvelopeMode] = useState<EnvelopeMode>('single');
    const [createOpen,   setCreateOpen]   = useState(false);
    const [snackOpen,    setSnackOpen]    = useState(false);
    const [snackMsg,     setSnackMsg]     = useState('');
    const [snackSev,     setSnackSev]     = useState<'success'|'error'|'info'|'warning'>('success');
    const [contribOpen,  setContribOpen]  = useState(false);
    const [contribEnvId, setContribEnvId] = useState<number | null>(null);
    const [affordOpen,   setAffordOpen]   = useState(false);
    const [leftPanelView, setLeftPanelView] = useState<LeftPanelView>('envelopes');
    const [filterStatus,  setFilterStatus]  = useState('ALL');
    const [filterType,    setFilterType]    = useState('ALL');
    const [selectedId,    setSelectedId]    = useState<number | null>(null);
    const [linkedGoalDialogOpen,  setLinkedGoalDialogOpen]  = useState(false);
    const [linkedGoalDialogGroup, setLinkedGoalDialogGroup] = useState<LinkedEnvelopeGroup | null>(null);
// ── Notification data (replaces the old hardcoded array) ───────────────────
    const [envelopeNotifications, setEnvelopeNotifications] = useState<EnvelopeNotification[]>([]);
    const [notifLoading, setNotifLoading] = useState(false);
    /** Whether the left envelopes panel is in edit mode */
    const [envelopePanelEditMode, setEnvelopePanelEditMode] = useState(false);

    /** System/email notification preference per envelope id (and per group, under a negative key) */
    const [notificationPrefs, setNotificationPrefs] = useState<Record<number, NotificationPrefs>>({});

    /** Which events trigger an alert, per envelope id (and per group, under a negative key) */
    const [notificationEventSettings, setNotificationEventSettings] = useState<Record<number, NotificationEventSettings>>({});

    /** The combined notification settings/history dialog — open state + which envelope(s) it's showing */
    const [notifDialogOpen,      setNotifDialogOpen]      = useState(false);
    const [notifDialogKey,       setNotifDialogKey]       = useState<number | null>(null);
    const [notifDialogTitle,     setNotifDialogTitle]     = useState('');
    const [notifDialogEnvelopes, setNotifDialogEnvelopes] = useState<BudgetEnvelope[]>([]);

    // ── Data state ─────────────────────────────────────────────────────────────
    const [envelopes,            setEnvelopes]            = useState<BudgetEnvelope[]>([]);
    const [contributions,        setContributions]        = useState<EnvelopeContribution[]>([]);
    const [linkedEnvelopeGroups, setLinkedEnvelopeGroups] = useState<LinkedEnvelopeGroup[]>([]);
    const [planBudget,   setPlanBudget]   = useState(0);
    const [planEntries,  setPlanEntries]  = useState<PlanEntry[]>([]);
    const [planTimeframe,setPlanTimeframe]= useState(4);
    const [planApplied,  setPlanApplied]  = useState(false);
    const budgetEnvelopeService = BudgetEnvelopeService.getInstance();
    const [scheduledContributions, setScheduledContributions] = useState<ScheduledContribution[]>([]);

    const userId = Number(sessionStorage.getItem('userId'));

    // ── Month navigator ────────────────────────────────────────────────────────
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const monthStart = useMemo(() =>
            new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
        [currentMonth]);

    const monthEnd = useMemo(() =>
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59),
        [currentMonth]);

    const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    const handlePrevMonth = () => setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1));

    const monthStartStr = monthStart.toISOString().split('T')[0];
    const monthEndStr   = monthEnd.toISOString().split('T')[0];


    // ── Check for new/past-due notifications on page entry, create if needed ──────

    // ── Fetch data ─────────────────────────────────────────────────────────────
    useEffect(() => {
        document.title = 'Envelopes';
        setTimeout(() => setAnimateIn(true), 100);
        if (!userId) { setIsLoading(false); return; }

        setIsLoading(true);
        BudgetEnvelopeService.getInstance()
            .fetchBudgetEnvelopes(userId, monthStartStr, monthEndStr)
            .then(data => {
                console.log('Fetched envelopes:', data.length);
                setEnvelopes(data);
                setContributions([]);
                return BudgetEnvelopeService.getInstance().fetchLinkedEnvelopes(userId, monthStartStr, monthEndStr);
            })
            .then(linkedData => {
                console.log('Fetched linked envelopes:', linkedData.length);
                setLinkedEnvelopeGroups(linkedData);
            })
            .catch(err => console.error('Failed:', err?.response?.status, err?.message))
            .finally(() => setIsLoading(false));

        return () => { document.title = 'BudgetBuddy'; };
    }, [userId, monthStartStr, monthEndStr]);

    // ── Derived data ───────────────────────────────────────────────────────────
    const activeEnvelopes = useMemo(() => envelopes.filter(e => e.status === 'ACTIVE'), [envelopes]);
    const defaultBudget   = useMemo(() => activeEnvelopes.reduce((s, e) => s + e.allocatedAmount, 0), [activeEnvelopes]);

    useEffect(() => {
        if (activeEnvelopes.length < 2 && envelopeMode === 'multi') setEnvelopeMode('single');
    }, [activeEnvelopes.length]);

    useEffect(() => {
        if (activeEnvelopes.length === 0) return;
        const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
        const initial: PlanEntry[] = sorted.map((env, i) => ({ envelopeId: env.id, priority: i + 1, monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount }));
        setPlanEntries(distributeAuto(initial, activeEnvelopes, defaultBudget));
        setPlanBudget(defaultBudget);
        setPlanApplied(false);
    }, [activeEnvelopes, defaultBudget]);

    useEffect(() => {
        if (activeEnvelopes.length === 0) return;
        let cancelled = false;
        const checkAndCreateNotifications = async () => {
            const results = await Promise.allSettled(
                activeEnvelopes.map(async (envelope) => {
                    // const hasNewOrPastDue = await EnvelopeNotificationService.getInstance()
                    //     .checkForNewAndPastDueNotifications(envelope.id, monthStart, monthEnd);
                    // The check endpoint tells us whether there are new/past-due items for this
                    // period that don't have notifications yet — only create when it's true, so
                    // we don't duplicate notifications that already exist for the current month.
                    await EnvelopeNotificationService.getInstance()
                            .createNewEnvelopeNotifications(envelope.id, monthStart, monthEnd);
                })
            );
            if (cancelled) return;
            results.forEach((result, i) => {
                if (result.status === 'rejected') {
                    console.error(
                        `Failed to check/create notifications for envelope ${activeEnvelopes[i].id}:`,
                        result.reason
                    );
                }
            });
        };

        checkAndCreateNotifications();

        return () => { cancelled = true; };
    }, [activeEnvelopes, monthStart, monthEnd]);


    useEffect(() => { setLeftPanelView('envelopes'); }, [selectedId]);

    // Exit edit mode when switching away from envelopes view
    useEffect(() => {
        if (leftPanelView !== 'envelopes') setEnvelopePanelEditMode(false);
    }, [leftPanelView]);

    // ── Notification preference handlers ───────────────────────────────────────

    /** Reads the current prefs for an envelope or group key, falling back to the default. */
    const getNotifPrefs = useCallback((key: number): NotificationPrefs =>
        notificationPrefs[key] ?? DEFAULT_NOTIF_PREFS, [notificationPrefs]);

    /** Toggles one channel (system/email) for a single envelope, independent of its group. */
    const toggleEnvelopeNotif = useCallback((envelopeId: number, channel: 'system' | 'email') => {
        setNotificationPrefs(prev => {
            const current = prev[envelopeId] ?? DEFAULT_NOTIF_PREFS;
            return { ...prev, [envelopeId]: { ...current, [channel]: !current[channel] } };
        });
    }, []);

    const handleOpenLinkedGoalUpdate = useCallback((group: LinkedEnvelopeGroup) => {
        setLinkedGoalDialogGroup(group);
        setLinkedGoalDialogOpen(true);
    }, []);

    const handleLinkedGoalUpdate = useCallback(async (envelopeId: number, values: LinkedGoalUpdateValues) => {
        // TODO: replace with real API call, e.g.:
        // await BudgetEnvelopeService.getInstance().updateEnvelopeGoal(envelopeId, values);

        // Optimistic local update
        setEnvelopes(prev => prev.map(e => {
            if (e.id !== envelopeId) return e;
            return {
                ...e,
                targetDate:       values.targetDate       || e.targetDate,
                priority:         values.priority,
                balanceThreshold: values.balanceThreshold !== null
                    ? (values.balanceThreshold as number)
                    : undefined,
            };
        }));

        // Keep linked group member in sync
        setLinkedEnvelopeGroups(prev => prev.map(g => ({
            ...g,
            envelopes: g.envelopes.map(e => {
                if (e.id !== envelopeId) return e;
                return {
                    ...e,
                    targetDate:       values.targetDate       || e.targetDate,
                    priority:         values.priority,
                    balanceThreshold: values.balanceThreshold !== null
                        ? (values.balanceThreshold as number)
                        : undefined,
                };
            }),
        })));

        setSnackMsg('Goal updated!');
        setSnackSev('success');
        setSnackOpen(true);
    }, []);

    /**
     * Toggles one channel for an entire linked group: flips the group's master
     * switch and cascades that same value to every member envelope so the
     * group card and its member cards stay in sync. Members can still be
     * nudged individually afterward.
     */
    const toggleGroupNotif = useCallback((groupId: number, memberIds: number[], channel: 'system' | 'email') => {
        setNotificationPrefs(prev => {
            const gKey = groupNotifKey(groupId);
            const currentGroup = prev[gKey] ?? DEFAULT_NOTIF_PREFS;
            const nextValue = !currentGroup[channel];
            const next = { ...prev, [gKey]: { ...currentGroup, [channel]: nextValue } };
            memberIds.forEach(id => {
                const currentMember = next[id] ?? DEFAULT_NOTIF_PREFS;
                next[id] = { ...currentMember, [channel]: nextValue };
            });
            return next;
        });
    }, []);

    /** Reads the per-event alert settings for an envelope or group key, falling back to the default. */
    const getEventSettings = useCallback((key: number): NotificationEventSettings =>
        notificationEventSettings[key] ?? DEFAULT_NOTIFICATION_EVENT_SETTINGS, [notificationEventSettings]);

    /** Toggles one event type (contribution received, goal reached, etc.) for an envelope or group key. */
    const toggleEventSetting = useCallback((key: number, eventKey: keyof NotificationEventSettings) => {
        setNotificationEventSettings(prev => {
            const current = prev[key] ?? DEFAULT_NOTIFICATION_EVENT_SETTINGS;
            return { ...prev, [key]: { ...current, [eventKey]: !current[eventKey] } };
        });
    }, []);

    /** Maps an envelope's backend status onto the dialog's badge vocabulary. */
    const mapNotificationBadge = (status?: string): { badge: string; badgeType: 'due' | 'behind' | 'read' | 'goal' } => {
        switch (status) {
            case 'LATE':      return { badge: 'Past due',  badgeType: 'behind' };
            case 'PENDING':   return { badge: 'Pending',   badgeType: 'due' };
            case 'PAID':
            case 'SUBMITTED':
            case 'COMPLETED': return { badge: 'Completed', badgeType: 'goal' };
            default:          return { badge: 'Update',    badgeType: 'read' };
        }
    };

    const toDialogNotifications = (items: EnvelopeNotification[]) =>
        items.map(n => {
            const { badge, badgeType } = mapNotificationBadge((n as any).envelopeStatus);
            return {
                id:           String((n as any).id ?? `${(n as any).envelopeId}-${(n as any).dateToContribute}`),
                envelopeId:   (n as any).envelopeId,
                envelopeName: (n as any).envelopeName ?? 'Envelope',
                // Every notification the backend produces today comes from the contribution-schedule
                // builder — there's no goal/account/group notification source yet. Hardcoding this
                // keeps the type accurate rather than guessing a category off badgeType, and gives
                // a single place to update once the backend actually distinguishes notification types.
                category:     'contribution' as const,
                date:         (n as any).dateToContribute ? new Date((n as any).dateToContribute).toISOString() : new Date().toISOString(),
                message:      (n as any).message ?? '',
                badge,
                badgeType,
                isRead:       (n as any).isRead ?? false,
            };
        });

    /** Loads notifications for whichever envelope(s) the dialog is about to show — a single
     *  envelope, or every member of a linked group when opened from the group-level icon. */
    const loadNotificationsForDialog = useCallback(async (key: number, historyEnvelopes: BudgetEnvelope[]) => {
        setNotifLoading(true);
        try {
            const envelopeIds = historyEnvelopes.length > 0
                ? historyEnvelopes.map(e => e.id)
                : (key > 0 ? [key] : []);

            const results = await Promise.all(
                envelopeIds.map(id => EnvelopeNotificationService.getInstance().getUserEnvelopeNotifications(id))
            );

            const merged = results.flat().sort(
                (a, b) => new Date((b as any).dateToContribute).getTime() - new Date((a as any).dateToContribute).getTime()
            );
            console.log('Merged notifications:', merged);
            setEnvelopeNotifications(merged);
        } catch (err) {
            console.error('Failed to load envelope notifications:', err);
            onSnack('Failed to load notifications', 'error');
            setEnvelopeNotifications([]);
        } finally {
            setNotifLoading(false);
        }
    }, []);

    /**
     * Opens the combined settings/history dialog. `key` is an envelope id for
     * a single envelope, or the group's negative key when opened from the
     * group-level icon; `historyEnvelopes` is just that one envelope, or
     * every member of the group, so the dialog can build its activity log.
     */

    /** Toggling a channel from inside the dialog should cascade for a group, same as clicking the group icon does. */
    const handleDialogTogglePref = useCallback((channel: 'system' | 'email') => {
        if (notifDialogKey === null) return;
        if (notifDialogEnvelopes.length > 1) {
            toggleGroupNotif(-notifDialogKey, notifDialogEnvelopes.map(e => e.id), channel);
        } else {
            toggleEnvelopeNotif(notifDialogKey, channel);
        }
    }, [notifDialogKey, notifDialogEnvelopes, toggleGroupNotif, toggleEnvelopeNotif]);

    const openNotifDialog = useCallback((key: number, title: string, historyEnvelopes: BudgetEnvelope[]) => {
        setNotifDialogKey(key);
        setNotifDialogTitle(title);
        setNotifDialogEnvelopes(historyEnvelopes);
        setNotifDialogOpen(true);
        loadNotificationsForDialog(key, historyEnvelopes);
    }, [loadNotificationsForDialog]);

    // ── Contribution handlers ──────────────────────────────────────────────────
    const openContribDialog = (id: number) => { setContribEnvId(id); setContribOpen(true); };

    const handleAddContribution = (envelopeId: number, amount: number, date: string, note: string) => {
        setContributions(prev => [{ id: prev.length + 1, envelopeId, amount, contributedAt: date, note: note || undefined } as EnvelopeContribution, ...prev]);
        setEnvelopes(prev => prev.map(e => {
            if (e.id !== envelopeId) return e;
            const newCurrent   = Math.min(e.currentAmount + amount, e.targetAmount);
            const newRemaining = Math.max(e.targetAmount - newCurrent, 0);
            return { ...e, currentAmount: newCurrent, remainingAmount: newRemaining, status: newRemaining === 0 ? 'COMPLETED' : e.status };
        }));
        setSnackMsg(`Contribution of ${fmt(amount)} added!`); setSnackSev('success'); setSnackOpen(true);
    };

    const handleSetupAuto = (envelopeId: number, rule: import('../config/Types').AutoRule) => {
        setEnvelopes(prev => prev.map(e => e.id === envelopeId ? { ...e, contributionMode: 'AUTO', autoRule: rule, allocatedAmount: rule.amount } : e));
        setSnackMsg('Auto-tracking enabled!'); setSnackSev('success'); setSnackOpen(true);
    };

    const handleToggleContribMode = (envelopeId: number, mode: 'MANUAL' | 'AUTO') => {
        setEnvelopes(prev => prev.map(e => e.id === envelopeId ? { ...e, contributionMode: mode, autoRule: mode === 'MANUAL' ? undefined : e.autoRule } : e));
        if (mode === 'AUTO') openContribDialog(envelopeId);
    };

    const handleApplyAffordability = (results: AffordabilityResult[]) => {
        const today = new Date().toISOString().split('T')[0];
        results.forEach(r => handleAddContribution(r.envelopeId, r.suggested, today, 'Affordability check'));
        setSnackMsg(`Applied ${results.length} contribution${results.length !== 1 ? 's' : ''}!`); setSnackSev('success'); setSnackOpen(true);
    };

    /** Applies an adjusted monthly allocation from the payment plan adjuster. */
    const handleApplyPlanAdjustment = useCallback((envelopeId: number, newMonthlyAllocation: number) => {
        setEnvelopes(prev => prev.map(e =>
            e.id === envelopeId ? { ...e, allocatedAmount: newMonthlyAllocation } : e
        ));
    }, []);

    // ── Linked group edit handlers ─────────────────────────────────────────────

    /**
     * Called when the user saves edits to a linked envelope group.
     * Optimistically updates local state; replace with API calls as needed.
     */
    const handleSaveGroupEdit = useCallback(async (
        groupId:    number,
        newName:    string,
        removedIds: number[],
        addedIds:   number[],
    ) => {
        try {
            // TODO: replace with real API calls, e.g.:
            // await BudgetEnvelopeService.getInstance().updateLinkedGroup(groupId, { name: newName, removedIds, addedIds });

            // Optimistic local update — rename the group
            setLinkedEnvelopeGroups(prev => prev.map(g => {
                if (g.id !== groupId) return g;
                return { ...g, linkName: newName };
            }));

            // Move removed envelopes out of the group and back to individual
            if (removedIds.length > 0) {
                setLinkedEnvelopeGroups(prev => prev.map(g => {
                    if (g.id !== groupId) return g;
                    return { ...g, envelopes: g.envelopes.filter(e => !removedIds.includes(e.id)) };
                }));
                setEnvelopes(prev => prev.map(e =>
                    removedIds.includes(e.id) ? { ...e, linked: false } : e
                ));
            }

            // Move added envelopes into the group
            if (addedIds.length > 0) {
                const toAdd = envelopes.filter(e => addedIds.includes(e.id));
                setLinkedEnvelopeGroups(prev => prev.map(g => {
                    if (g.id !== groupId) return g;
                    return { ...g, envelopes: [...g.envelopes, ...toAdd] };
                }));
                setEnvelopes(prev => prev.map(e =>
                    addedIds.includes(e.id) ? { ...e, linked: true } : e
                ));
            }

            setSnackMsg('Group updated!');
            setSnackSev('success');
            setSnackOpen(true);
            setEnvelopePanelEditMode(false);
        } catch (err) {
            console.error('Failed to update group:', err);
            setSnackMsg('Failed to update group. Please try again.');
            setSnackSev('error');
            setSnackOpen(true);
        }
    }, [envelopes]);

    /**
     * Called when the user confirms dissolving a linked group.
     * All member envelopes become individual envelopes.
     */
    const handleDissolveGroup = useCallback(async (groupId: number) => {
        try {
            // TODO: replace with real API call, e.g.:
            // await BudgetEnvelopeService.getInstance().dissolveLinkedGroup(groupId);

            const group = linkedEnvelopeGroups.find(g => g.id === groupId);
            if (!group) return;

            // Remove the group and un-link all member envelopes
            setLinkedEnvelopeGroups(prev => prev.filter(g => g.id !== groupId));
            const memberIds = group.envelopes.map(e => e.id);
            setEnvelopes(prev => prev.map(e =>
                memberIds.includes(e.id) ? { ...e, linked: false } : e
            ));

            setSnackMsg('Group dissolved. Envelopes are now individual.');
            setSnackSev('info');
            setSnackOpen(true);
            setEnvelopePanelEditMode(false);
        } catch (err) {
            console.error('Failed to dissolve group:', err);
            setSnackMsg('Failed to dissolve group. Please try again.');
            setSnackSev('error');
            setSnackOpen(true);
        }
    }, [linkedEnvelopeGroups]);

    // ── Planner handlers ───────────────────────────────────────────────────────
    const redistributePlan = useCallback((budget: number, entries: PlanEntry[]) => {
        setPlanEntries(distributeAuto(entries, activeEnvelopes, budget));
    }, [activeEnvelopes]);

    const handlePlanBudgetChange = (v: number) => { setPlanBudget(v); redistributePlan(v, planEntries); };
    const handlePlanAlloc  = (id: number, v: number) => setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, monthlyAlloc: v } : e));
    const handlePlanLock   = (id: number) => setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, locked: !e.locked } : e));

    const movePlanUp   = (idx: number) => { if (idx === 0) return; setPlanEntries(prev => { const n = [...prev]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n.map((e, i) => ({ ...e, priority: i + 1 })); }); };
    const movePlanDown = (idx: number) => { setPlanEntries(prev => { if (idx >= prev.length - 1) return prev; const n = [...prev]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n.map((e, i) => ({ ...e, priority: i + 1 })); }); };

    const resetPlanToAuto = () => {
        const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
        const reset: PlanEntry[] = sorted.map((env, i) => ({ envelopeId: env.id, priority: i + 1, monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount }));
        setPlanEntries(distributeAuto(reset, activeEnvelopes, planBudget));
    };

    const handleApplyPlan = () => {
        setEnvelopes(prev => prev.map(e => { const entry = planEntries.find(p => p.envelopeId === e.id); return entry ? { ...e, allocatedAmount: entry.monthlyAlloc } : e; }));
        setPlanApplied(true); setSnackMsg('Priority plan applied!'); setSnackSev('success'); setSnackOpen(true);
        setTimeout(() => setPlanApplied(false), 2000);
    };

    // ── Computed values ────────────────────────────────────────────────────────
    const planResults   = useMemo(() => computeResults(planEntries, activeEnvelopes), [planEntries, activeEnvelopes]);
    const planAllocated = planEntries.reduce((s, e) => s + e.monthlyAlloc, 0);
    const planSurplus   = planBudget - planAllocated;

    const selectedEnvelope = useMemo(() => envelopes.find(e => e.id === selectedId) ?? null, [envelopes, selectedId]);

    const selectedContributions = useMemo(() =>
            contributions.filter(c => {
                if (c.envelopeId !== selectedId) return false;
                const d = new Date(c.contributedAt);
                return d >= monthStart && d <= monthEnd;
            }),
        [contributions, selectedId, monthStart, monthEnd]);

    const filtered = useMemo(() => envelopes.filter(e => {
        const statusOk = filterStatus === 'ALL' || e.status === filterStatus;
        const typeOk   = filterType   === 'ALL' || e.envelopeType === filterType;
        const monthOk  = isEnvelopeActiveInMonth(e, monthStart, monthEnd);
        return statusOk && typeOk && monthOk;
    }), [envelopes, filterStatus, filterType, monthStart, monthEnd]);

    const stats = useMemo(() => {
        const active = envelopes.filter(e => e.status === 'ACTIVE');
        return {
            totalEnvelopes: active.length,
            totalAllocated: active.reduce((s, e) => s + e.allocatedAmount, 0),
            totalSaved:     active.reduce((s, e) => s + e.currentAmount,   0),
            totalTarget:    active.reduce((s, e) => s + e.targetAmount,    0),
            completed:      envelopes.filter(e => e.status === 'COMPLETED').length,
        };
    }, [envelopes]);

    const overallPct      = stats.totalTarget > 0 ? Math.min((stats.totalSaved / stats.totalTarget) * 100, 100) : 0;
    const contribEnvelope = useMemo(() => envelopes.find(e => e.id === contribEnvId) ?? null, [envelopes, contribEnvId]);

    /** Individual (non-linked) envelopes available to be added to a group */
    const individualEnvelopes = useMemo(() =>
            envelopes.filter(e => !e.linked && isEnvelopeActiveInMonth(e, monthStart, monthEnd)),
        [envelopes, monthStart, monthEnd]);

    /** The linked group the currently selected envelope belongs to, if any */
    const selectedLinkedGroup = useMemo(() => {
        if (!selectedEnvelope?.linked) return null;
        return linkedEnvelopeGroups.find(g => g.envelopes.some(e => e.id === selectedEnvelope.id)) ?? null;
    }, [selectedEnvelope, linkedEnvelopeGroups]);

    /** Whether the right panel's current selection came from "View group stats" rather than a specific member */
    const [initialDetailView, setInitialDetailView] = useState<'individual' | 'group'>('individual');

    /** The group currently shown as "group stats" in the right panel, if any */
    const selectedGroupId = initialDetailView === 'group' ? selectedLinkedGroup?.id ?? null : null;

    const handleSelectEnvelope = useCallback((id: number | null) => {
        setSelectedId(id);
        setInitialDetailView('individual');
    }, []);

    const handleSelectGroup = useCallback((group: LinkedEnvelopeGroup) => {
        if (group.envelopes.length === 0) return;
        setSelectedId(group.envelopes[0].id);
        setInitialDetailView('group');
    }, []);

    // ── Filter button helper ───────────────────────────────────────────────────
    const filterBtn = (label: string, value: string, current: string, setter: (v: string) => void) => (
        <Button key={value} size="small" onClick={() => setter(value)} variant={current === value ? 'contained' : 'outlined'}
                sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
                    ...(current === value
                        ? { bgcolor: MAROON, color: '#fff', borderColor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }
                        : { borderColor: '#d5d5d5', color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }) }}>
            {label}
        </Button>
    );

    const onSnack = (msg: string, sev: 'success' | 'error' | 'info' | 'warning') => {
        setSnackMsg(msg); setSnackSev(sev); setSnackOpen(true);
    };

    // ══════════════════════════════════════════════════════════════════════════
    return (
        <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
            <Sidebar />

            {/* Loading overlay */}
            {isLoading && (
                <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <CircularProgress size={52} thickness={4} sx={{ color: MAROON, mb: 2.5 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Loading Envelopes</Typography>
                    <Typography variant="body2" color="text.secondary">Fetching your savings goals…</Typography>
                </Box>
            )}

            <Container maxWidth="xl" sx={{ py: 4 }}>

                {/* ── Header ──────────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={400}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                        <Box>
                            <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
                            <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
                                {monthLabel.split(' ')[1]} {monthLabel.split(' ')[0]} Envelopes
                            </Typography>
                            <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
                                {envelopeMode === 'single' ? 'Dedicated funds — tap any card for details' : 'Portfolio view — stats, timeline & priority management'}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
                            {/* Month navigator */}
                            <IconButton onClick={handlePrevMonth} size="small" sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON_DARK } }}>
                                <ChevronLeft size={16} />
                            </IconButton>
                            <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', border: '1px solid #e0e0e0', bgcolor: '#f9f9f9' }}>
                                <Calendar size={13} color="#888" />
                                <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#222' }}>{monthLabel}</Typography>
                            </Box>
                            <IconButton onClick={handleNextMonth} size="small" sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON_DARK } }}>
                                <ChevronRight size={16} />
                            </IconButton>

                            {/* View toggle */}
                            <Box sx={{ display: 'flex', p: '4px', borderRadius: '12px', bgcolor: '#e4e4e7', gap: '3px' }}>
                                <Button size="small" onClick={() => setEnvelopeMode('single')} startIcon={<Wallet size={13} />}
                                        sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.75, py: 0.7, minWidth: 0, transition: 'all 0.18s',
                                            ...(envelopeMode === 'single'
                                                ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 6px rgba(0,0,0,0.13)', '&:hover': { bgcolor: '#fff' } }
                                                : { bgcolor: 'transparent', color: '#71717a', '&:hover': { bgcolor: alpha('#fff', 0.55) } }) }}>
                                    Envelopes
                                </Button>
                                <Tooltip title={activeEnvelopes.length < 2 ? 'Need at least 2 active envelopes' : ''}>
                                    <Box>
                                        <Button size="small" disabled={activeEnvelopes.length < 2} onClick={() => setEnvelopeMode('multi')} startIcon={<LayoutList size={13} />}
                                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.75, py: 0.7, minWidth: 0, transition: 'all 0.18s',
                                                    ...(envelopeMode === 'multi'
                                                        ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 6px rgba(0,0,0,0.13)', '&:hover': { bgcolor: '#fff' } }
                                                        : { bgcolor: 'transparent', color: '#71717a', '&:hover': { bgcolor: alpha('#fff', 0.55) } }),
                                                    '&.Mui-disabled': { bgcolor: 'transparent', color: '#c4c4c4' } }}>
                                            Multi-envelope
                                        </Button>
                                    </Box>
                                </Tooltip>
                            </Box>

                            <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => setCreateOpen(true)}
                                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, px: 2.5, py: 1 }}>
                                New Envelope
                            </Button>
                        </Box>
                    </Box>
                </Grow>

                {/* ── Summary cards ────────────────────────────────────────── */}
                <Grow in={animateIn} timeout={600}>
                    <Grid container spacing={2.5} sx={{ mb: 4 }}>
                        {[
                            { label: 'Active Envelopes',  value: String(stats.totalEnvelopes), sub: `${stats.completed} completed`,                     color: MAROON,    bg: '#f0f4ff', chip: <><Layers size={10} /> All time</>,    pct: 100        },
                            { label: 'Monthly Allocated', value: fmt(stats.totalAllocated),    sub: `across ${stats.totalEnvelopes} envelopes`,          color: '#7c3aed', bg: '#faf5ff', chip: <><Calendar size={10} /> /month</>,  pct: 100        },
                            { label: 'Total Saved',       value: fmt(stats.totalSaved),        sub: `${overallPct.toFixed(0)}% of all targets`,          color: '#16a34a', bg: '#f0fdf4', chip: <><TrendingUp size={10} /> progress</>,pct: overallPct },
                            { label: 'Total Target',      value: fmt(stats.totalTarget),       sub: `${fmt(stats.totalTarget - stats.totalSaved)} left`,  color: '#0284c7', bg: '#f0f9ff', chip: <><Target size={10} /> goal</>,     pct: 100        },
                        ].map(({ label, value, sub, color, bg, chip, pct }) => (
                            <Grid item xs={12} sm={6} md={3} key={label}>
                                <Box sx={{ background: bg, borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
                                    <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(color, 0.7), fontWeight: 700, mb: 1 }}>{label}</Typography>
                                    {isLoading ? <Skeleton variant="text" width="60%" height={42} /> : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color, lineHeight: 1, mb: 0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>}
                                    <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <Typography sx={{ fontSize: '0.72rem', color: alpha(color, 0.65) }}>{sub}</Typography>
                                        <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>{chip}</Box>
                                    </Box>
                                </Box>
                            </Grid>
                        ))}
                    </Grid>
                </Grow>

                {/* ── ENVELOPES VIEW ──────────────────────────────────────── */}
                {envelopeMode === 'single' && (
                    <>
                        {/* Affordability banner */}
                        {activeEnvelopes.length >= 2 && (
                            <Grow in={animateIn} timeout={650}>
                                <Box sx={{ mb: 3, p: 2, borderRadius: '12px', background: `linear-gradient(135deg, ${alpha(MAROON, 0.04)}, ${alpha(MAROON, 0.08)})`, border: `1px solid ${alpha(MAROON, 0.18)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                            <Calculator size={16} color={MAROON} />
                                        </Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111' }}>Can I contribute this month?</Typography>
                                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.1 }}>Enter your available balance and see which of your {activeEnvelopes.length} active envelopes you can fund right now.</Typography>
                                        </Box>
                                    </Box>
                                    <Button variant="contained" startIcon={<Sparkles size={14} />} onClick={() => setAffordOpen(true)}
                                            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, px: 2.5, py: 1, flexShrink: 0 }}>
                                        Run check
                                    </Button>
                                </Box>
                            </Grow>
                        )}

                        {/* Type filters */}
                        <Grow in={animateIn} timeout={700}>
                            <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                                <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Type:</Typography>
                                {['ALL','SAVINGS','PAYOFF','PURCHASE','EMERGENCY'].map(v =>
                                    filterBtn(v === 'ALL' ? 'All' : ENVELOPE_TYPE_LABELS[v], v, filterType, setFilterType)
                                )}
                            </Box>
                        </Grow>

                        <Grid container spacing={3}>
                            {/* ── Left panel ────────────────────────────────── */}
                            <Grid item xs={12} lg={8}>
                                <EnvelopeLeftPanel
                                    animateIn={animateIn}
                                    leftPanelView={leftPanelView}
                                    onSetLeftPanelView={setLeftPanelView}
                                    envelopePanelEditMode={envelopePanelEditMode}
                                    onToggleEditMode={() => setEnvelopePanelEditMode(p => !p)}
                                    selectedEnvelope={selectedEnvelope}
                                    filtered={filtered}
                                    linkedEnvelopeGroups={linkedEnvelopeGroups}
                                    individualEnvelopes={individualEnvelopes}
                                    envelopes={envelopes}
                                    contributions={contributions}
                                    selectedContributions={selectedContributions}
                                    monthStart={monthStart}
                                    monthEnd={monthEnd}
                                    monthLabel={monthLabel}
                                    isLoading={isLoading}
                                    selectedId={selectedId}
                                    onSelectEnvelope={handleSelectEnvelope}
                                    onAddManual={openContribDialog}
                                    onSnack={onSnack}
                                    getNotifPrefs={getNotifPrefs}
                                    onToggleEnvelopeNotification={toggleEnvelopeNotif}
                                    onToggleGroupNotification={toggleGroupNotif}
                                    onOpenNotificationDialog={openNotifDialog}
                                    onSaveGroupEdit={handleSaveGroupEdit}
                                    onDissolveGroup={handleDissolveGroup}
                                    onOpenLinkedGoalUpdate={handleOpenLinkedGoalUpdate}
                                    onSelectGroup={handleSelectGroup}
                                    selectedGroupId={selectedGroupId}
                                    onApplyPlanAdjustment={handleApplyPlanAdjustment}
                                />
                            </Grid>

                            {/* ── Right detail panel ────────────────────────── */}
                            <Grid item xs={12} lg={4}>
                                <Grow in={animateIn} timeout={800}>
                                    <Box sx={{ position: 'sticky', top: 24 }}>
                                        <EnvelopeDetailPanel
                                            selectedEnvelope={selectedEnvelope}
                                            envelopes={envelopes}
                                            contributions={contributions}
                                            monthStart={monthStart}
                                            monthEnd={monthEnd}
                                            monthLabel={monthLabel}
                                            onClose={() => handleSelectEnvelope(null)}
                                            onAddManual={openContribDialog}
                                            onToggleContribMode={handleToggleContribMode}
                                            onSetLeftPanel={setLeftPanelView}
                                            scheduledContributions={selectedEnvelope?.contributions ?? []}
                                            onSnack={onSnack}
                                            onSelectEnvelope={handleSelectEnvelope}
                                            linkedGroup={selectedLinkedGroup}
                                            onOpenLinkedGoalUpdate={handleOpenLinkedGoalUpdate}
                                            onOpenGroupNotificationSettings={(group) => openNotifDialog(groupNotifKey(group.id), group.linkName, group.envelopes)}
                                            initialDetailView={initialDetailView}
                                        />
                                    </Box>
                                </Grow>
                            </Grid>
                        </Grid>
                    </>
                )}

                {/* ── MULTI-ENVELOPE VIEW ──────────────────────────────────── */}
                {envelopeMode === 'multi' && (
                    <Grow in timeout={350}>
                        <Box>
                            <MultiEnvelopeDashboard
                                envelopes={envelopes}
                                contributions={contributions}
                                monthStart={monthStart}
                                monthEnd={monthEnd}
                                monthLabel={monthLabel}
                                planEntries={planEntries}
                                planResults={planResults}
                                planBudget={planBudget}
                                onBudgetChange={handlePlanBudgetChange}
                                onAlloc={handlePlanAlloc}
                                onLock={handlePlanLock}
                                onMoveUp={movePlanUp}
                                onMoveDown={movePlanDown}
                                onAutoReset={resetPlanToAuto}
                                onApplyPlan={handleApplyPlan}
                            />
                        </Box>
                    </Grow>
                )}
            </Container>

            {/* ── Dialogs ──────────────────────────────────────────────────── */}
            <ManualContributionDialog
                open={contribOpen}
                envelope={contribEnvelope}
                onClose={() => setContribOpen(false)}
                onSubmit={handleAddContribution}
                onSetupAuto={handleSetupAuto}
            />
            <AffordabilityDialog
                open={affordOpen}
                envelopes={activeEnvelopes}
                onClose={() => setAffordOpen(false)}
                onApplyAll={handleApplyAffordability}
            />
            <NotificationsDialog
                open={notifDialogOpen}
                onClose={() => setNotifDialogOpen(false)}
                subjectName={notifDialogTitle}
                notifications={toDialogNotifications(envelopeNotifications)}
                onMarkAllRead={async () => {
                    try {
                        const unread = envelopeNotifications.filter(n => !(n as any).isRead);
                        await Promise.all(
                            unread.map(n => EnvelopeNotificationService.getInstance().updateEnvelopeNotificationReadStatus((n as any).id, true))
                        );
                        setEnvelopeNotifications(prev => prev.map(n => ({ ...n, isRead: true } as EnvelopeNotification)));
                        setSnackMsg('All notifications marked as read');
                        setSnackSev('success');
                        setSnackOpen(true);
                        setNotifDialogOpen(false);
                    } catch (err) {
                        console.error('Failed to mark notifications as read:', err);
                        setSnackMsg('Failed to mark notifications as read. Please try again.');
                        setSnackSev('error');
                        setSnackOpen(true);
                    }
                }}
                onAccept={async (id) => {
                    try {
                        await EnvelopeNotificationService.getInstance().sendEnvelopeAcceptNotification(Number(id));
                        setEnvelopeNotifications(prev =>
                            prev.map(n => String((n as any).id) === String(id) ? ({ ...n, isRead: true } as EnvelopeNotification) : n)
                        );
                        setSnackMsg('Notification accepted');
                        setSnackSev('success');
                        setSnackOpen(true);
                    } catch (err) {
                        console.error('Failed to accept notification:', err);
                        setSnackMsg('Failed to accept notification. Please try again.');
                        setSnackSev('error');
                        setSnackOpen(true);
                    }
                }}
            />

            <CreateEnvelopeDialog
                open={createOpen}
                onClose={() => setCreateOpen(false)}
                onSubmit={async (data: NewEnvelopeForm | NewEnvelopeForm[], isLinked: boolean) => {
                    const forms = Array.isArray(data) ? data : [data];
                    try {
                        const criteria: NewEnvelopeCriteria[] = forms.map(f => ({
                            goalType:            f.envelopeType as string,
                            goalName:            f.envelopeName,
                            envelopeType:        (f.envelopeType === '' ? 'FUND' : f.envelopeType) as EnvelopeType,
                            description:         f.description ?? '',
                            targetAmount:        f.targetAmount === '' ? 0 : f.targetAmount,
                            initialContribution: f.startingAmount === '' ? 0 : f.startingAmount,
                            startDate:           new Date().toISOString().split('T')[0],
                            targetDate:          f.targetDate,
                            autoContribution:    f.contributionMode === 'auto',
                            frequency:           f.contributionFrequency,
                            paymentInfo:         f.paymentInfo ?? null,
                            score:               0,
                            userId,
                        }));
                        const request: EnvelopeCreateRequest = { criteria, isLinked };
                        await BudgetEnvelopeService.getInstance().createEnvelope(request, userId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]);
                        const updated = await BudgetEnvelopeService.getInstance().fetchBudgetEnvelopes(userId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]);
                        setEnvelopes(updated);
                        setSnackMsg(isLinked ? `${forms.length} linked envelopes created!` : 'Envelope created!');
                        setSnackSev('success');
                        setSnackOpen(true);
                    } catch (err) {
                        console.error('Failed to create envelope:', err);
                        setSnackMsg('Failed to create envelope. Please try again.');
                        setSnackSev('error');
                        setSnackOpen(true);
                    } finally {
                        setCreateOpen(false);
                    }
                }}
            />

            <LinkedGoalUpdateDialog
                open={linkedGoalDialogOpen}
                group={linkedGoalDialogGroup}
                onClose={() => { setLinkedGoalDialogOpen(false); setLinkedGoalDialogGroup(null); }}
                onSubmit={handleLinkedGoalUpdate}
                totalEnvelopes={envelopes.filter(e => e.status === 'ACTIVE').length}
            />
            <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
                <Alert onClose={() => setSnackOpen(false)} severity={snackSev} sx={{ width: '100%', borderRadius: 2 }}>{snackMsg}</Alert>
            </Snackbar>
        </Box>
    );
};

export default BudgetEnvelopesPage;
// import React, { useCallback, useEffect, useMemo, useState } from 'react';
// import {
//     alpha, Alert, Box, Button, Chip, CircularProgress, Container,
//     Divider, Grid, Grow, IconButton, LinearProgress, Skeleton,
//     Snackbar, Stack, Tooltip, Typography,
// } from '@mui/material';
// import {
//     Plus, Target, Wallet, TrendingUp, CheckCircle, PauseCircle,
//     Flame, MoreHorizontal, ArrowUpRight, Clock, Layers, BarChart2,
//     Calendar, RefreshCcw, Calculator, Sparkles, CreditCard, Settings2,
//     ChevronLeft, ChevronRight, AlertTriangle, PiggyBank, LayoutList, XCircle,
//     Pencil, X as XIcon, Sliders,
// } from 'lucide-react';
// import {
//     Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement,
//     PointElement, ArcElement, Filler, Tooltip as ChartTooltip, Legend,
// } from 'chart.js';
//
// import Sidebar from './Sidebar';
// import CreateEnvelopeDialog, { NewEnvelopeForm } from './CreateEnvelopeDialog';
// import MultiEnvelopeDashboard from './MultiEnvelopeDashboard';
// import BudgetEnvelopeService, { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
// import { EnvelopeCreateRequest, EnvelopeType, NewEnvelopeCriteria, ScheduledContribution } from '../config/Types';
//
// import { BudgetEnvelope, EnvelopeContribution, PlanEntry, PlanResult, AffordabilityResult } from '../config/Types';
// import { MAROON, MAROON_DARK, ENVELOPE_COLORS, ENVELOPE_TYPE_LABELS, STATUS_META, TYPE_ICONS, FREQUENCY_OPTIONS } from '../config/Constants';
// import { fmt, daysUntil, progressPct, velocityDays, requiredMonthly, monthlyContributed, isEnvelopeActiveInMonth, urgencyScore, distributeAuto, computeResults, monthsBetween } from '../config/Helpers';
// import { VelocityChip, PanelHeader, ContributionRow } from './Shared';
// import EnvelopeCard     from './EnvelopeCard';
// import PaymentPlanPanel from './PaymentPlanPanel';
// import ChartsPanel      from './ChartsPanel';
// import InsightsPanel    from './InsightsPanel';
// import { ManualContributionDialog, AffordabilityDialog } from './Shared';
// import EnvelopeDetailPanel from './EnvelopeDetailPanel';
// import LinkedEnvelopeGroupCard from './LinkedEnvelopeGroupCard';
// import PaymentPlanAdjuster from './PaymentPlanAdjuster';
// import { NotificationPrefs, NotificationEventSettings, DEFAULT_NOTIFICATION_EVENT_SETTINGS } from './NotificationToggle';
// import { NotificationsDialog } from './NotificationsDialog';
// import {GoalUpdateValues} from "./GoalUpdateDialog";
// import LinkedGoalUpdateDialog, { LinkedGoalUpdateValues } from './LinkedGoalUpdateDialog';
//
//
// ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Filler, ChartTooltip, Legend);
//
// type EnvelopeMode   = 'single' | 'multi';
// type LeftPanelView  = 'envelopes' | 'analytics' | 'paymentplan' | 'planadjuster';
//
// /** Default notification preferences applied to an envelope/group the first time it's seen */
// const DEFAULT_NOTIF_PREFS: NotificationPrefs = { system: true, email: false };
//
// /**
//  * Linked groups and individual envelopes both live in the same id space from the
//  * backend, so we mirror a group's master toggle under a negative key
//  * (-groupId) to avoid ever colliding with a real envelope id.
//  */
// const groupNotifKey = (groupId: number) => -groupId;
//
// const BudgetEnvelopesPage: React.FC = () => {
//     // ── UI state ───────────────────────────────────────────────────────────────
//     const [animateIn,    setAnimateIn]    = useState(false);
//     const [isLoading,    setIsLoading]    = useState(false);
//     const [envelopeMode, setEnvelopeMode] = useState<EnvelopeMode>('single');
//     const [createOpen,   setCreateOpen]   = useState(false);
//     const [snackOpen,    setSnackOpen]    = useState(false);
//     const [snackMsg,     setSnackMsg]     = useState('');
//     const [snackSev,     setSnackSev]     = useState<'success'|'error'|'info'|'warning'>('success');
//     const [contribOpen,  setContribOpen]  = useState(false);
//     const [contribEnvId, setContribEnvId] = useState<number | null>(null);
//     const [affordOpen,   setAffordOpen]   = useState(false);
//     const [leftPanelView, setLeftPanelView] = useState<LeftPanelView>('envelopes');
//     const [filterStatus,  setFilterStatus]  = useState('ALL');
//     const [filterType,    setFilterType]    = useState('ALL');
//     const [selectedId,    setSelectedId]    = useState<number | null>(null);
//     const [linkedGoalDialogOpen,  setLinkedGoalDialogOpen]  = useState(false);
//     const [linkedGoalDialogGroup, setLinkedGoalDialogGroup] = useState<LinkedEnvelopeGroup | null>(null);
//
//     /** Whether the left envelopes panel is in edit mode */
//     const [envelopePanelEditMode, setEnvelopePanelEditMode] = useState(false);
//
//     /** System/email notification preference per envelope id (and per group, under a negative key) */
//     const [notificationPrefs, setNotificationPrefs] = useState<Record<number, NotificationPrefs>>({});
//
//     /** Which events trigger an alert, per envelope id (and per group, under a negative key) */
//     const [notificationEventSettings, setNotificationEventSettings] = useState<Record<number, NotificationEventSettings>>({});
//
//     /** The combined notification settings/history dialog — open state + which envelope(s) it's showing */
//     const [notifDialogOpen,      setNotifDialogOpen]      = useState(false);
//     const [notifDialogKey,       setNotifDialogKey]       = useState<number | null>(null);
//     const [notifDialogTitle,     setNotifDialogTitle]     = useState('');
//     const [notifDialogEnvelopes, setNotifDialogEnvelopes] = useState<BudgetEnvelope[]>([]);
//
//     // ── Data state ─────────────────────────────────────────────────────────────
//     const [envelopes,            setEnvelopes]            = useState<BudgetEnvelope[]>([]);
//     const [contributions,        setContributions]        = useState<EnvelopeContribution[]>([]);
//     const [linkedEnvelopeGroups, setLinkedEnvelopeGroups] = useState<LinkedEnvelopeGroup[]>([]);
//     const [planBudget,   setPlanBudget]   = useState(0);
//     const [planEntries,  setPlanEntries]  = useState<PlanEntry[]>([]);
//     const [planTimeframe,setPlanTimeframe]= useState(4);
//     const [planApplied,  setPlanApplied]  = useState(false);
//     const budgetEnvelopeService = BudgetEnvelopeService.getInstance();
//     const [scheduledContributions, setScheduledContributions] = useState<ScheduledContribution[]>([]);
//
//     const userId = Number(sessionStorage.getItem('userId'));
//
//     // ── Month navigator ────────────────────────────────────────────────────────
//     const [currentMonth, setCurrentMonth] = useState(new Date());
//
//     const monthStart = useMemo(() =>
//             new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1),
//         [currentMonth]);
//
//     const monthEnd = useMemo(() =>
//             new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59),
//         [currentMonth]);
//
//     const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
//     const handlePrevMonth = () => setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth() - 1, 1));
//     const handleNextMonth = () => setCurrentMonth(p => new Date(p.getFullYear(), p.getMonth() + 1, 1));
//
//     const monthStartStr = monthStart.toISOString().split('T')[0];
//     const monthEndStr   = monthEnd.toISOString().split('T')[0];
//
//     // ── Fetch data ─────────────────────────────────────────────────────────────
//     useEffect(() => {
//         document.title = 'Envelopes';
//         setTimeout(() => setAnimateIn(true), 100);
//         if (!userId) { setIsLoading(false); return; }
//
//         setIsLoading(true);
//         BudgetEnvelopeService.getInstance()
//             .fetchBudgetEnvelopes(userId, monthStartStr, monthEndStr)
//             .then(data => {
//                 console.log('Fetched envelopes:', data.length);
//                 setEnvelopes(data);
//                 setContributions([]);
//                 return BudgetEnvelopeService.getInstance().fetchLinkedEnvelopes(userId, monthStartStr, monthEndStr);
//             })
//             .then(linkedData => {
//                 console.log('Fetched linked envelopes:', linkedData.length);
//                 setLinkedEnvelopeGroups(linkedData);
//             })
//             .catch(err => console.error('Failed:', err?.response?.status, err?.message))
//             .finally(() => setIsLoading(false));
//
//         return () => { document.title = 'BudgetBuddy'; };
//     }, [userId, monthStartStr, monthEndStr]);
//
//     // ── Derived data ───────────────────────────────────────────────────────────
//     const activeEnvelopes = useMemo(() => envelopes.filter(e => e.status === 'ACTIVE'), [envelopes]);
//     const defaultBudget   = useMemo(() => activeEnvelopes.reduce((s, e) => s + e.allocatedAmount, 0), [activeEnvelopes]);
//
//     useEffect(() => {
//         if (activeEnvelopes.length < 2 && envelopeMode === 'multi') setEnvelopeMode('single');
//     }, [activeEnvelopes.length]);
//
//     useEffect(() => {
//         if (activeEnvelopes.length === 0) return;
//         const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
//         const initial: PlanEntry[] = sorted.map((env, i) => ({ envelopeId: env.id, priority: i + 1, monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount }));
//         setPlanEntries(distributeAuto(initial, activeEnvelopes, defaultBudget));
//         setPlanBudget(defaultBudget);
//         setPlanApplied(false);
//     }, [activeEnvelopes, defaultBudget]);
//
//     useEffect(() => { setLeftPanelView('envelopes'); }, [selectedId]);
//
//     // Exit edit mode when switching away from envelopes view
//     useEffect(() => {
//         if (leftPanelView !== 'envelopes') setEnvelopePanelEditMode(false);
//     }, [leftPanelView]);
//
//     // ── Notification preference handlers ───────────────────────────────────────
//
//     /** Reads the current prefs for an envelope or group key, falling back to the default. */
//     const getNotifPrefs = useCallback((key: number): NotificationPrefs =>
//         notificationPrefs[key] ?? DEFAULT_NOTIF_PREFS, [notificationPrefs]);
//
//     /** Toggles one channel (system/email) for a single envelope, independent of its group. */
//     const toggleEnvelopeNotif = useCallback((envelopeId: number, channel: 'system' | 'email') => {
//         setNotificationPrefs(prev => {
//             const current = prev[envelopeId] ?? DEFAULT_NOTIF_PREFS;
//             return { ...prev, [envelopeId]: { ...current, [channel]: !current[channel] } };
//         });
//     }, []);
//
//     const handleOpenLinkedGoalUpdate = useCallback((group: LinkedEnvelopeGroup) => {
//         setLinkedGoalDialogGroup(group);
//         setLinkedGoalDialogOpen(true);
//     }, []);
//
//     const handleLinkedGoalUpdate = useCallback(async (envelopeId: number, values: LinkedGoalUpdateValues) => {
//         // TODO: replace with real API call, e.g.:
//         // await BudgetEnvelopeService.getInstance().updateEnvelopeGoal(envelopeId, values);
//
//         // Optimistic local update
//         setEnvelopes(prev => prev.map(e => {
//             if (e.id !== envelopeId) return e;
//             return {
//                 ...e,
//                 targetDate:       values.targetDate       || e.targetDate,
//                 priority:         values.priority,
//                 balanceThreshold: values.balanceThreshold !== null
//                     ? (values.balanceThreshold as number)
//                     : undefined,
//             };
//         }));
//
//         // Keep linked group member in sync
//         setLinkedEnvelopeGroups(prev => prev.map(g => ({
//             ...g,
//             envelopes: g.envelopes.map(e => {
//                 if (e.id !== envelopeId) return e;
//                 return {
//                     ...e,
//                     targetDate:       values.targetDate       || e.targetDate,
//                     priority:         values.priority,
//                     balanceThreshold: values.balanceThreshold !== null
//                         ? (values.balanceThreshold as number)
//                         : undefined,
//                 };
//             }),
//         })));
//
//         setSnackMsg('Goal updated!');
//         setSnackSev('success');
//         setSnackOpen(true);
//     }, []);
//
//     /**
//      * Toggles one channel for an entire linked group: flips the group's master
//      * switch and cascades that same value to every member envelope so the
//      * group card and its member cards stay in sync. Members can still be
//      * nudged individually afterward.
//      */
//     const toggleGroupNotif = useCallback((groupId: number, memberIds: number[], channel: 'system' | 'email') => {
//         setNotificationPrefs(prev => {
//             const gKey = groupNotifKey(groupId);
//             const currentGroup = prev[gKey] ?? DEFAULT_NOTIF_PREFS;
//             const nextValue = !currentGroup[channel];
//             const next = { ...prev, [gKey]: { ...currentGroup, [channel]: nextValue } };
//             memberIds.forEach(id => {
//                 const currentMember = next[id] ?? DEFAULT_NOTIF_PREFS;
//                 next[id] = { ...currentMember, [channel]: nextValue };
//             });
//             return next;
//         });
//     }, []);
//
//     /** Reads the per-event alert settings for an envelope or group key, falling back to the default. */
//     const getEventSettings = useCallback((key: number): NotificationEventSettings =>
//         notificationEventSettings[key] ?? DEFAULT_NOTIFICATION_EVENT_SETTINGS, [notificationEventSettings]);
//
//     /** Toggles one event type (contribution received, goal reached, etc.) for an envelope or group key. */
//     const toggleEventSetting = useCallback((key: number, eventKey: keyof NotificationEventSettings) => {
//         setNotificationEventSettings(prev => {
//             const current = prev[key] ?? DEFAULT_NOTIFICATION_EVENT_SETTINGS;
//             return { ...prev, [key]: { ...current, [eventKey]: !current[eventKey] } };
//         });
//     }, []);
//
//     /**
//      * Opens the combined settings/history dialog. `key` is an envelope id for
//      * a single envelope, or the group's negative key when opened from the
//      * group-level icon; `historyEnvelopes` is just that one envelope, or
//      * every member of the group, so the dialog can build its activity log.
//      */
//     const openNotifDialog = useCallback((key: number, title: string, historyEnvelopes: BudgetEnvelope[]) => {
//         setNotifDialogKey(key);
//         setNotifDialogTitle(title);
//         setNotifDialogEnvelopes(historyEnvelopes);
//         setNotifDialogOpen(true);
//     }, []);
//
//     /** Toggling a channel from inside the dialog should cascade for a group, same as clicking the group icon does. */
//     const handleDialogTogglePref = useCallback((channel: 'system' | 'email') => {
//         if (notifDialogKey === null) return;
//         if (notifDialogEnvelopes.length > 1) {
//             toggleGroupNotif(-notifDialogKey, notifDialogEnvelopes.map(e => e.id), channel);
//         } else {
//             toggleEnvelopeNotif(notifDialogKey, channel);
//         }
//     }, [notifDialogKey, notifDialogEnvelopes, toggleGroupNotif, toggleEnvelopeNotif]);
//
//     // ── Contribution handlers ──────────────────────────────────────────────────
//     const openContribDialog = (id: number) => { setContribEnvId(id); setContribOpen(true); };
//
//     const handleAddContribution = (envelopeId: number, amount: number, date: string, note: string) => {
//         setContributions(prev => [{ id: prev.length + 1, envelopeId, amount, contributedAt: date, note: note || undefined } as EnvelopeContribution, ...prev]);
//         setEnvelopes(prev => prev.map(e => {
//             if (e.id !== envelopeId) return e;
//             const newCurrent   = Math.min(e.currentAmount + amount, e.targetAmount);
//             const newRemaining = Math.max(e.targetAmount - newCurrent, 0);
//             return { ...e, currentAmount: newCurrent, remainingAmount: newRemaining, status: newRemaining === 0 ? 'COMPLETED' : e.status };
//         }));
//         setSnackMsg(`Contribution of ${fmt(amount)} added!`); setSnackSev('success'); setSnackOpen(true);
//     };
//
//     const handleSetupAuto = (envelopeId: number, rule: import('../config/Types').AutoRule) => {
//         setEnvelopes(prev => prev.map(e => e.id === envelopeId ? { ...e, contributionMode: 'AUTO', autoRule: rule, allocatedAmount: rule.amount } : e));
//         setSnackMsg('Auto-tracking enabled!'); setSnackSev('success'); setSnackOpen(true);
//     };
//
//     const handleToggleContribMode = (envelopeId: number, mode: 'MANUAL' | 'AUTO') => {
//         setEnvelopes(prev => prev.map(e => e.id === envelopeId ? { ...e, contributionMode: mode, autoRule: mode === 'MANUAL' ? undefined : e.autoRule } : e));
//         if (mode === 'AUTO') openContribDialog(envelopeId);
//     };
//
//     const handleApplyAffordability = (results: AffordabilityResult[]) => {
//         const today = new Date().toISOString().split('T')[0];
//         results.forEach(r => handleAddContribution(r.envelopeId, r.suggested, today, 'Affordability check'));
//         setSnackMsg(`Applied ${results.length} contribution${results.length !== 1 ? 's' : ''}!`); setSnackSev('success'); setSnackOpen(true);
//     };
//
//     // ── Linked group edit handlers ─────────────────────────────────────────────
//
//     /**
//      * Called when the user saves edits to a linked envelope group.
//      * Optimistically updates local state; replace with API calls as needed.
//      */
//     const handleSaveGroupEdit = useCallback(async (
//         groupId:    number,
//         newName:    string,
//         removedIds: number[],
//         addedIds:   number[],
//     ) => {
//         try {
//             // TODO: replace with real API calls, e.g.:
//             // await BudgetEnvelopeService.getInstance().updateLinkedGroup(groupId, { name: newName, removedIds, addedIds });
//
//             // Optimistic local update — rename the group
//             setLinkedEnvelopeGroups(prev => prev.map(g => {
//                 if (g.id !== groupId) return g;
//                 return { ...g, linkName: newName };
//             }));
//
//             // Move removed envelopes out of the group and back to individual
//             if (removedIds.length > 0) {
//                 setLinkedEnvelopeGroups(prev => prev.map(g => {
//                     if (g.id !== groupId) return g;
//                     return { ...g, envelopes: g.envelopes.filter(e => !removedIds.includes(e.id)) };
//                 }));
//                 setEnvelopes(prev => prev.map(e =>
//                     removedIds.includes(e.id) ? { ...e, linked: false } : e
//                 ));
//             }
//
//             // Move added envelopes into the group
//             if (addedIds.length > 0) {
//                 const toAdd = envelopes.filter(e => addedIds.includes(e.id));
//                 setLinkedEnvelopeGroups(prev => prev.map(g => {
//                     if (g.id !== groupId) return g;
//                     return { ...g, envelopes: [...g.envelopes, ...toAdd] };
//                 }));
//                 setEnvelopes(prev => prev.map(e =>
//                     addedIds.includes(e.id) ? { ...e, linked: true } : e
//                 ));
//             }
//
//             setSnackMsg('Group updated!');
//             setSnackSev('success');
//             setSnackOpen(true);
//             setEnvelopePanelEditMode(false);
//         } catch (err) {
//             console.error('Failed to update group:', err);
//             setSnackMsg('Failed to update group. Please try again.');
//             setSnackSev('error');
//             setSnackOpen(true);
//         }
//     }, [envelopes]);
//
//     /**
//      * Called when the user confirms dissolving a linked group.
//      * All member envelopes become individual envelopes.
//      */
//     const handleDissolveGroup = useCallback(async (groupId: number) => {
//         try {
//             // TODO: replace with real API call, e.g.:
//             // await BudgetEnvelopeService.getInstance().dissolveLinkedGroup(groupId);
//
//             const group = linkedEnvelopeGroups.find(g => g.id === groupId);
//             if (!group) return;
//
//             // Remove the group and un-link all member envelopes
//             setLinkedEnvelopeGroups(prev => prev.filter(g => g.id !== groupId));
//             const memberIds = group.envelopes.map(e => e.id);
//             setEnvelopes(prev => prev.map(e =>
//                 memberIds.includes(e.id) ? { ...e, linked: false } : e
//             ));
//
//             setSnackMsg('Group dissolved. Envelopes are now individual.');
//             setSnackSev('info');
//             setSnackOpen(true);
//             setEnvelopePanelEditMode(false);
//         } catch (err) {
//             console.error('Failed to dissolve group:', err);
//             setSnackMsg('Failed to dissolve group. Please try again.');
//             setSnackSev('error');
//             setSnackOpen(true);
//         }
//     }, [linkedEnvelopeGroups]);
//
//     // ── Planner handlers ───────────────────────────────────────────────────────
//     const redistributePlan = useCallback((budget: number, entries: PlanEntry[]) => {
//         setPlanEntries(distributeAuto(entries, activeEnvelopes, budget));
//     }, [activeEnvelopes]);
//
//     const handlePlanBudgetChange = (v: number) => { setPlanBudget(v); redistributePlan(v, planEntries); };
//     const handlePlanAlloc  = (id: number, v: number) => setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, monthlyAlloc: v } : e));
//     const handlePlanLock   = (id: number) => setPlanEntries(prev => prev.map(e => e.envelopeId === id ? { ...e, locked: !e.locked } : e));
//
//     const movePlanUp   = (idx: number) => { if (idx === 0) return; setPlanEntries(prev => { const n = [...prev]; [n[idx-1], n[idx]] = [n[idx], n[idx-1]]; return n.map((e, i) => ({ ...e, priority: i + 1 })); }); };
//     const movePlanDown = (idx: number) => { setPlanEntries(prev => { if (idx >= prev.length - 1) return prev; const n = [...prev]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; return n.map((e, i) => ({ ...e, priority: i + 1 })); }); };
//
//     const resetPlanToAuto = () => {
//         const sorted = [...activeEnvelopes].sort((a, b) => urgencyScore(b) - urgencyScore(a));
//         const reset: PlanEntry[] = sorted.map((env, i) => ({ envelopeId: env.id, priority: i + 1, monthlyAlloc: env.allocatedAmount, locked: false, autoAlloc: env.allocatedAmount }));
//         setPlanEntries(distributeAuto(reset, activeEnvelopes, planBudget));
//     };
//
//     const handleApplyPlan = () => {
//         setEnvelopes(prev => prev.map(e => { const entry = planEntries.find(p => p.envelopeId === e.id); return entry ? { ...e, allocatedAmount: entry.monthlyAlloc } : e; }));
//         setPlanApplied(true); setSnackMsg('Priority plan applied!'); setSnackSev('success'); setSnackOpen(true);
//         setTimeout(() => setPlanApplied(false), 2000);
//     };
//
//     // ── Computed values ────────────────────────────────────────────────────────
//     const planResults   = useMemo(() => computeResults(planEntries, activeEnvelopes), [planEntries, activeEnvelopes]);
//     const planAllocated = planEntries.reduce((s, e) => s + e.monthlyAlloc, 0);
//     const planSurplus   = planBudget - planAllocated;
//
//     const selectedEnvelope = useMemo(() => envelopes.find(e => e.id === selectedId) ?? null, [envelopes, selectedId]);
//
//     const selectedContributions = useMemo(() =>
//             contributions.filter(c => {
//                 if (c.envelopeId !== selectedId) return false;
//                 const d = new Date(c.contributedAt);
//                 return d >= monthStart && d <= monthEnd;
//             }),
//         [contributions, selectedId, monthStart, monthEnd]);
//
//     const filtered = useMemo(() => envelopes.filter(e => {
//         const statusOk = filterStatus === 'ALL' || e.status === filterStatus;
//         const typeOk   = filterType   === 'ALL' || e.envelopeType === filterType;
//         const monthOk  = isEnvelopeActiveInMonth(e, monthStart, monthEnd);
//         return statusOk && typeOk && monthOk;
//     }), [envelopes, filterStatus, filterType, monthStart, monthEnd]);
//
//     const stats = useMemo(() => {
//         const active = envelopes.filter(e => e.status === 'ACTIVE');
//         return {
//             totalEnvelopes: active.length,
//             totalAllocated: active.reduce((s, e) => s + e.allocatedAmount, 0),
//             totalSaved:     active.reduce((s, e) => s + e.currentAmount,   0),
//             totalTarget:    active.reduce((s, e) => s + e.targetAmount,    0),
//             completed:      envelopes.filter(e => e.status === 'COMPLETED').length,
//         };
//     }, [envelopes]);
//
//     const overallPct      = stats.totalTarget > 0 ? Math.min((stats.totalSaved / stats.totalTarget) * 100, 100) : 0;
//     const contribEnvelope = useMemo(() => envelopes.find(e => e.id === contribEnvId) ?? null, [envelopes, contribEnvId]);
//
//     /** Individual (non-linked) envelopes available to be added to a group */
//     const individualEnvelopes = useMemo(() =>
//             envelopes.filter(e => !e.linked && isEnvelopeActiveInMonth(e, monthStart, monthEnd)),
//         [envelopes, monthStart, monthEnd]);
//
//     // ── Filter button helper ───────────────────────────────────────────────────
//     const filterBtn = (label: string, value: string, current: string, setter: (v: string) => void) => (
//         <Button key={value} size="small" onClick={() => setter(value)} variant={current === value ? 'contained' : 'outlined'}
//                 sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 600, fontSize: '0.72rem',
//                     ...(current === value
//                         ? { bgcolor: MAROON, color: '#fff', borderColor: MAROON, '&:hover': { bgcolor: MAROON_DARK } }
//                         : { borderColor: '#d5d5d5', color: '#555', bgcolor: '#fff', '&:hover': { borderColor: MAROON, color: MAROON, bgcolor: alpha(MAROON, 0.04) } }) }}>
//             {label}
//         </Button>
//     );
//
//     // ══════════════════════════════════════════════════════════════════════════
//     return (
//         <Box sx={{ maxWidth: 'calc(100% - 240px)', ml: '240px', minHeight: '100vh', background: '#f0f2f5' }}>
//             <Sidebar />
//
//             {/* Loading overlay */}
//             {isLoading && (
//                 <Box sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(6px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
//                     <CircularProgress size={52} thickness={4} sx={{ color: MAROON, mb: 2.5 }} />
//                     <Typography variant="h6" sx={{ fontWeight: 700, color: '#111', mb: 0.5 }}>Loading Envelopes</Typography>
//                     <Typography variant="body2" color="text.secondary">Fetching your savings goals…</Typography>
//                 </Box>
//             )}
//
//             <Container maxWidth="xl" sx={{ py: 4 }}>
//
//                 {/* ── Header ──────────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={400}>
//                     <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
//                         <Box>
//                             <Box sx={{ width: 28, height: 3, background: MAROON, borderRadius: '2px', mb: 0.75 }} />
//                             <Typography variant="h4" component="h1" sx={{ fontWeight: 800, color: '#111', letterSpacing: '-0.025em' }}>
//                                 {monthLabel.split(' ')[1]} {monthLabel.split(' ')[0]} Envelopes
//                             </Typography>
//                             <Typography variant="subtitle1" sx={{ color: '#888', mt: 0.5 }}>
//                                 {envelopeMode === 'single' ? 'Dedicated funds — tap any card for details' : 'Portfolio view — stats, timeline & priority management'}
//                             </Typography>
//                         </Box>
//                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
//                             {/* Month navigator */}
//                             <IconButton onClick={handlePrevMonth} size="small" sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON_DARK } }}>
//                                 <ChevronLeft size={16} />
//                             </IconButton>
//                             <Box sx={{ px: 2, py: 0.75, display: 'flex', alignItems: 'center', gap: 1, borderRadius: '8px', border: '1px solid #e0e0e0', bgcolor: '#f9f9f9' }}>
//                                 <Calendar size={13} color="#888" />
//                                 <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#222' }}>{monthLabel}</Typography>
//                             </Box>
//                             <IconButton onClick={handleNextMonth} size="small" sx={{ width: 32, height: 32, borderRadius: '6px', bgcolor: MAROON, color: '#fff', '&:hover': { bgcolor: MAROON_DARK } }}>
//                                 <ChevronRight size={16} />
//                             </IconButton>
//
//                             {/* View toggle */}
//                             <Box sx={{ display: 'flex', p: '4px', borderRadius: '12px', bgcolor: '#e4e4e7', gap: '3px' }}>
//                                 <Button size="small" onClick={() => setEnvelopeMode('single')} startIcon={<Wallet size={13} />}
//                                         sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.75, py: 0.7, minWidth: 0, transition: 'all 0.18s',
//                                             ...(envelopeMode === 'single'
//                                                 ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 6px rgba(0,0,0,0.13)', '&:hover': { bgcolor: '#fff' } }
//                                                 : { bgcolor: 'transparent', color: '#71717a', '&:hover': { bgcolor: alpha('#fff', 0.55) } }) }}>
//                                     Envelopes
//                                 </Button>
//                                 <Tooltip title={activeEnvelopes.length < 2 ? 'Need at least 2 active envelopes' : ''}>
//                                     <Box>
//                                         <Button size="small" disabled={activeEnvelopes.length < 2} onClick={() => setEnvelopeMode('multi')} startIcon={<LayoutList size={13} />}
//                                                 sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', px: 1.75, py: 0.7, minWidth: 0, transition: 'all 0.18s',
//                                                     ...(envelopeMode === 'multi'
//                                                         ? { bgcolor: '#fff', color: MAROON, boxShadow: '0 1px 6px rgba(0,0,0,0.13)', '&:hover': { bgcolor: '#fff' } }
//                                                         : { bgcolor: 'transparent', color: '#71717a', '&:hover': { bgcolor: alpha('#fff', 0.55) } }),
//                                                     '&.Mui-disabled': { bgcolor: 'transparent', color: '#c4c4c4' } }}>
//                                             Multi-envelope
//                                         </Button>
//                                     </Box>
//                                 </Tooltip>
//                             </Box>
//
//                             <Button variant="contained" startIcon={<Plus size={15} />} onClick={() => setCreateOpen(true)}
//                                     sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, px: 2.5, py: 1 }}>
//                                 New Envelope
//                             </Button>
//                         </Box>
//                     </Box>
//                 </Grow>
//
//                 {/* ── Summary cards ────────────────────────────────────────── */}
//                 <Grow in={animateIn} timeout={600}>
//                     <Grid container spacing={2.5} sx={{ mb: 4 }}>
//                         {[
//                             { label: 'Active Envelopes',  value: String(stats.totalEnvelopes), sub: `${stats.completed} completed`,                     color: MAROON,    bg: '#f0f4ff', chip: <><Layers size={10} /> All time</>,    pct: 100        },
//                             { label: 'Monthly Allocated', value: fmt(stats.totalAllocated),    sub: `across ${stats.totalEnvelopes} envelopes`,          color: '#7c3aed', bg: '#faf5ff', chip: <><Calendar size={10} /> /month</>,  pct: 100        },
//                             { label: 'Total Saved',       value: fmt(stats.totalSaved),        sub: `${overallPct.toFixed(0)}% of all targets`,          color: '#16a34a', bg: '#f0fdf4', chip: <><TrendingUp size={10} /> progress</>,pct: overallPct },
//                             { label: 'Total Target',      value: fmt(stats.totalTarget),       sub: `${fmt(stats.totalTarget - stats.totalSaved)} left`,  color: '#0284c7', bg: '#f0f9ff', chip: <><Target size={10} /> goal</>,     pct: 100        },
//                         ].map(({ label, value, sub, color, bg, chip, pct }) => (
//                             <Grid item xs={12} sm={6} md={3} key={label}>
//                                 <Box sx={{ background: bg, borderRadius: '10px', borderTop: `3px solid ${color}`, boxShadow: '0 2px 12px rgba(0,0,0,0.10)', p: 2.5, transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(0,0,0,0.14)' } }}>
//                                     <Typography sx={{ fontSize: '0.67rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: alpha(color, 0.7), fontWeight: 700, mb: 1 }}>{label}</Typography>
//                                     {isLoading ? <Skeleton variant="text" width="60%" height={42} /> : <Typography sx={{ fontSize: '1.65rem', fontWeight: 800, color, lineHeight: 1, mb: 0.5, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>}
//                                     <LinearProgress variant="determinate" value={pct} sx={{ my: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15), '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
//                                     <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
//                                         <Typography sx={{ fontSize: '0.72rem', color: alpha(color, 0.65) }}>{sub}</Typography>
//                                         <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4, px: 0.9, py: 0.3, borderRadius: '20px', bgcolor: alpha(color, 0.1), color, fontSize: '0.65rem', fontWeight: 700 }}>{chip}</Box>
//                                     </Box>
//                                 </Box>
//                             </Grid>
//                         ))}
//                     </Grid>
//                 </Grow>
//
//                 {/* ── ENVELOPES VIEW ──────────────────────────────────────── */}
//                 {envelopeMode === 'single' && (
//                     <>
//                         {/* Affordability banner */}
//                         {activeEnvelopes.length >= 2 && (
//                             <Grow in={animateIn} timeout={650}>
//                                 <Box sx={{ mb: 3, p: 2, borderRadius: '12px', background: `linear-gradient(135deg, ${alpha(MAROON, 0.04)}, ${alpha(MAROON, 0.08)})`, border: `1px solid ${alpha(MAROON, 0.18)}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
//                                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
//                                         <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: alpha(MAROON, 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                             <Calculator size={16} color={MAROON} />
//                                         </Box>
//                                         <Box>
//                                             <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#111' }}>Can I contribute this month?</Typography>
//                                             <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.1 }}>Enter your available balance and see which of your {activeEnvelopes.length} active envelopes you can fund right now.</Typography>
//                                         </Box>
//                                     </Box>
//                                     <Button variant="contained" startIcon={<Sparkles size={14} />} onClick={() => setAffordOpen(true)}
//                                             sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.82rem', bgcolor: MAROON, '&:hover': { bgcolor: MAROON_DARK }, px: 2.5, py: 1, flexShrink: 0 }}>
//                                         Run check
//                                     </Button>
//                                 </Box>
//                             </Grow>
//                         )}
//
//                         {/* Type filters */}
//                         <Grow in={animateIn} timeout={700}>
//                             <Box sx={{ display: 'flex', gap: 1, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
//                                 <Typography sx={{ fontSize: '0.72rem', fontWeight: 700, color: '#888', mr: 0.5 }}>Type:</Typography>
//                                 {['ALL','SAVINGS','PAYOFF','PURCHASE','EMERGENCY'].map(v =>
//                                     filterBtn(v === 'ALL' ? 'All' : ENVELOPE_TYPE_LABELS[v], v, filterType, setFilterType)
//                                 )}
//                             </Box>
//                         </Grow>
//
//                         <Grid container spacing={3}>
//                             {/* ── Left panel ────────────────────────────────── */}
//                             <Grid item xs={12} lg={8}>
//                                 <Box sx={{ borderRadius: '16px', overflow: 'hidden', border: `1px solid ${alpha(MAROON, 0.15)}`, boxShadow: `0 4px 24px ${alpha(MAROON, 0.08)}` }}>
//
//                                     {/* Panel header + view toggle */}
//                                     <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`, px: 3, py: 2, position: 'relative', overflow: 'hidden' }}>
//                                         <Box sx={{ position: 'absolute', top: -16, right: -16, width: 80, height: 80, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.06)' }} />
//                                         <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', gap: 1.5 }}>
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
//                                                 <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                     {leftPanelView === 'envelopes'
//                                                         ? (envelopePanelEditMode ? <Pencil size={15} color="white" /> : <Wallet size={15} color="white" />)
//                                                         : leftPanelView === 'analytics' ? <BarChart2 size={15} color="white" />
//                                                             : leftPanelView === 'planadjuster' ? <Sliders size={15} color="white" />
//                                                                 : <CreditCard size={15} color="white" />}
//                                                 </Box>
//                                                 <Box sx={{ minWidth: 0 }}>
//                                                     <Typography sx={{ fontWeight: 800, fontSize: '0.92rem', color: '#fff', letterSpacing: '-0.01em' }}>
//                                                         {leftPanelView === 'envelopes'
//                                                             ? (envelopePanelEditMode ? 'Edit envelopes' : 'Your Envelopes')
//                                                             : leftPanelView === 'analytics' ? 'Analytics'
//                                                                 : leftPanelView === 'planadjuster' ? `Adjust Plan — ${selectedEnvelope?.envelopeName ?? ''}`
//                                                                     : `Payment Plan — ${selectedEnvelope?.envelopeName ?? ''}`}
//                                                     </Typography>
//                                                     <Typography sx={{ fontSize: '0.67rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>
//                                                         {leftPanelView === 'envelopes'
//                                                             ? (envelopePanelEditMode
//                                                                 ? 'Manage group members · add or remove envelopes'
//                                                                 : `${filtered.length} envelope${filtered.length !== 1 ? 's' : ''} active in ${monthLabel}`)
//                                                             : leftPanelView === 'analytics'
//                                                                 ? 'Velocity, allocation, timeline & insights'
//                                                                 : leftPanelView === 'planadjuster'
//                                                                     ? 'Adjust your monthly payment and preview the payoff'
//                                                                     : 'Schedule, acceleration simulator & amortization'}
//                                                     </Typography>
//                                                 </Box>
//                                             </Box>
//
//                                             {/* Right-side controls */}
//                                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
//                                                 {/* Edit / Exit edit button — only shown on envelopes view when there are linked groups */}
//                                                 {leftPanelView === 'envelopes' && linkedEnvelopeGroups.length > 0 && (
//                                                     <Button
//                                                         size="small"
//                                                         onClick={() => setEnvelopePanelEditMode(p => !p)}
//                                                         startIcon={envelopePanelEditMode ? <XIcon size={12} /> : <Pencil size={12} />}
//                                                         sx={{
//                                                             borderRadius: '7px', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem',
//                                                             px: 1.5, py: 0.6,
//                                                             ...(envelopePanelEditMode
//                                                                 ? { bgcolor: 'rgba(255,255,255,0.9)', color: MAROON, '&:hover': { bgcolor: '#fff' } }
//                                                                 : { bgcolor: 'rgba(255,255,255,0.14)', color: '#fff', border: '0.5px solid rgba(255,255,255,0.22)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }),
//                                                         }}
//                                                     >
//                                                         {envelopePanelEditMode ? 'Exit edit' : 'Edit'}
//                                                     </Button>
//                                                 )}
//
//                                                 {/* View tabs */}
//                                                 <Box sx={{ display: 'flex', p: '3px', borderRadius: '9px', bgcolor: 'rgba(0,0,0,0.25)', gap: '2px' }}>
//                                                     {[
//                                                         { key: 'envelopes'   as const, label: 'Envelopes',  icon: <Wallet     size={12} /> },
//                                                         { key: 'analytics'   as const, label: 'Analytics',  icon: <BarChart2  size={12} /> },
//                                                         ...(selectedEnvelope?.envelopeType === 'PAYOFF' && selectedEnvelope?.paymentPlan
//                                                             ? [
//                                                                 { key: 'paymentplan' as const, label: 'Pay plan',   icon: <CreditCard size={12} /> },
//                                                                 { key: 'planadjuster' as const, label: 'Adjust plan', icon: <Sliders size={12} /> },
//                                                             ]
//                                                             : []),
//                                                     ].map(({ key, label, icon }) => (
//                                                         <Button key={key} size="small" onClick={() => setLeftPanelView(key)} startIcon={icon}
//                                                                 sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 700, fontSize: '0.72rem', px: 1.5, py: 0.5, minWidth: 0, gap: 0.5, transition: 'all 0.18s',
//                                                                     ...(leftPanelView === key
//                                                                         ? { bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' } }
//                                                                         : { bgcolor: 'transparent', color: 'rgba(255,255,255,0.55)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' } }) }}>
//                                                             {label}
//                                                         </Button>
//                                                     ))}
//                                                 </Box>
//                                             </Box>
//                                         </Box>
//                                     </Box>
//
//                                     {/* Envelopes view */}
//                                     {leftPanelView === 'envelopes' && (
//                                         <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                             {/* Linked groups */}
//                                             {linkedEnvelopeGroups.length > 0 && (
//                                                 <>
//                                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
//                                                         Linked groups
//                                                         {envelopePanelEditMode && (
//                                                             <Box component="span" sx={{ ml: 1, color: MAROON, fontWeight: 700, textTransform: 'none', letterSpacing: 0, fontSize: '0.65rem' }}>
//                                                                 — edit group members below
//                                                             </Box>
//                                                         )}
//                                                     </Typography>
//                                                     <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//                                                         {linkedEnvelopeGroups.map(group => (
//                                                             <LinkedEnvelopeGroupCard
//                                                                 key={group.id}
//                                                                 group={group}
//                                                                 onSelectEnvelope={(id: number) => setSelectedId(id)}
//                                                                 selectedId={selectedId}
//                                                                 editMode={envelopePanelEditMode}
//                                                                 onSaveGroupEdit={handleSaveGroupEdit}
//                                                                 onDissolveGroup={handleDissolveGroup}
//                                                                 availableEnvelopes={individualEnvelopes}
//                                                                 groupNotificationPrefs={getNotifPrefs(groupNotifKey(group.id))}
//                                                                 onToggleGroupNotification={(channel) => toggleGroupNotif(group.id, group.envelopes.map(e => e.id), channel)}
//                                                                 onOpenGroupNotificationSettings={() => openNotifDialog(groupNotifKey(group.id), group.linkName, group.envelopes)}
//                                                                 getMemberNotificationPrefs={getNotifPrefs}
//                                                                 onToggleMemberNotification={toggleEnvelopeNotif}
//                                                                 onOpenMemberNotificationSettings={(envelopeId) => {
//                                                                     const member = group.envelopes.find(e => e.id === envelopeId);
//                                                                     if (member) openNotifDialog(envelopeId, member.envelopeName, [member]);
//                                                                 }}
//                                                                 onOpenGoalUpdate={() => handleOpenLinkedGoalUpdate(group)}   // ← add this
//                                                             />
//                                                         ))}
//                                                     </Box>
//                                                     <Divider sx={{ mb: 2, mt: 2 }} />
//                                                 </>
//                                             )}
//
//                                             {/* Individual envelopes */}
//                                             {filtered.filter(e => !e.linked).length > 0 && (
//                                                 <>
//                                                     <Typography sx={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1.25 }}>
//                                                         Individual envelopes
//                                                         {envelopePanelEditMode && (
//                                                             <Box component="span" sx={{ ml: 1, color: '#aaa', fontWeight: 500, textTransform: 'none', letterSpacing: 0, fontSize: '0.65rem', fontStyle: 'italic' }}>
//                                                                 — tap + on a group above to move one here
//                                                             </Box>
//                                                         )}
//                                                     </Typography>
//                                                     <Grid container spacing={2}>
//                                                         {filtered.filter(e => !e.linked).map((env, i) => (
//                                                             <Grid item xs={12} sm={6} key={env.id} sx={{ display: 'flex' }}>
//                                                                 <EnvelopeCard
//                                                                     envelope={env}
//                                                                     animateIn={animateIn}
//                                                                     timeout={700 + i * 80}
//                                                                     contributions={contributions}
//                                                                     monthContributed={monthlyContributed(contributions, env.id, monthStart, monthEnd)}
//                                                                     onClick={() => !envelopePanelEditMode && setSelectedId(env.id === selectedId ? null : env.id)}
//                                                                     onAddManual={openContribDialog}
//                                                                     notificationPrefs={getNotifPrefs(env.id)}
//                                                                     onToggleNotification={(channel) => toggleEnvelopeNotif(env.id, channel)}
//                                                                     onOpenNotificationSettings={() => openNotifDialog(env.id, env.envelopeName, [env])}
//                                                                 />
//                                                             </Grid>
//                                                         ))}
//                                                     </Grid>
//                                                 </>
//                                             )}
//
//                                             {filtered.length === 0 && !isLoading && (
//                                                 <Box sx={{ textAlign: 'center', py: 4 }}>
//                                                     <PiggyBank size={40} color={alpha(MAROON, 0.25)} />
//                                                     <Typography sx={{ mt: 2, fontWeight: 700, color: '#555' }}>No envelopes active in {monthLabel}</Typography>
//                                                     <Typography sx={{ mt: 0.5, fontSize: '0.82rem', color: '#aaa' }}>Try navigating to a different month or adjusting the filters above.</Typography>
//                                                 </Box>
//                                             )}
//                                         </Box>
//                                     )}
//
//                                     {/* Analytics view */}
//                                     {leftPanelView === 'analytics' && !isLoading && (
//                                         <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                             <InsightsPanel envelopes={envelopes} contributions={contributions} />
//                                             <ChartsPanel   envelopes={envelopes} contributions={contributions} />
//                                         </Box>
//                                     )}
//
//                                     {/* Payment plan view */}
//                                     {leftPanelView === 'paymentplan' && selectedEnvelope?.paymentPlan && (
//                                         <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                             {selectedEnvelope.paymentPlan.isDeferred && (
//                                                 <Box sx={{ mb: 3, p: 2, borderRadius: '10px', bgcolor: alpha('#dc2626', 0.05), border: `1px solid ${alpha('#dc2626', 0.2)}`, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
//                                                     <Box sx={{ width: 34, height: 34, borderRadius: '9px', bgcolor: alpha('#dc2626', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                                         <AlertTriangle size={16} color="#dc2626" />
//                                                     </Box>
//                                                     <Box>
//                                                         <Typography sx={{ fontWeight: 800, fontSize: '0.88rem', color: '#dc2626' }}>Deferred interest at risk: {fmt(selectedEnvelope.paymentPlan.deferredInterest)}</Typography>
//                                                         <Typography sx={{ fontSize: '0.72rem', color: '#7f1d1d', mt: 0.3, lineHeight: 1.5 }}>
//                                                             If {fmt(selectedEnvelope.remainingAmount)} isn't cleared by {selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}, the full 26.99% APR back-interest applies from the original purchase date.
//                                                         </Typography>
//                                                     </Box>
//                                                 </Box>
//                                             )}
//                                             <PaymentPlanPanel envelope={selectedEnvelope} contributions={selectedContributions} />
//                                         </Box>
//                                     )}
//
//                                     {/* Plan adjuster view */}
//                                     {leftPanelView === 'planadjuster' && selectedEnvelope?.paymentPlan && (
//                                         <Box sx={{ bgcolor: '#fff', p: 3 }}>
//                                             <PaymentPlanAdjuster
//                                                 envelope={selectedEnvelope}
//                                                 contributions={selectedContributions}
//                                                 onApply={(envelopeId, newMonthlyAllocation) => {
//                                                     setEnvelopes(prev => prev.map(e =>
//                                                         e.id === envelopeId ? { ...e, allocatedAmount: newMonthlyAllocation } : e
//                                                     ));
//                                                     setSnackMsg('Payment schedule updated!');
//                                                     setSnackSev('success');
//                                                     setSnackOpen(true);
//                                                 }}
//                                             />
//                                         </Box>
//                                     )}
//                                 </Box>
//                             </Grid>
//
//                             {/* ── Right detail panel ────────────────────────── */}
//                             <Grid item xs={12} lg={4}>
//                                 <Grow in={animateIn} timeout={800}>
//                                     <Box sx={{ position: 'sticky', top: 24 }}>
//                                         <EnvelopeDetailPanel
//                                             selectedEnvelope={selectedEnvelope}
//                                             envelopes={envelopes}
//                                             contributions={contributions}
//                                             monthStart={monthStart}
//                                             monthEnd={monthEnd}
//                                             monthLabel={monthLabel}
//                                             onClose={() => setSelectedId(null)}
//                                             onAddManual={openContribDialog}
//                                             onToggleContribMode={handleToggleContribMode}
//                                             onSetLeftPanel={setLeftPanelView}
//                                             scheduledContributions={selectedEnvelope?.contributions ?? []}
//                                             onSnack={(msg, sev) => { setSnackMsg(msg); setSnackSev(sev); setSnackOpen(true); }}
//                                             onSelectEnvelope={(id) => setSelectedId(id)}
//                                         />
//                                     </Box>
//                                 </Grow>
//                             </Grid>
//                         </Grid>
//                     </>
//                 )}
//
//                 {/* ── MULTI-ENVELOPE VIEW ──────────────────────────────────── */}
//                 {envelopeMode === 'multi' && (
//                     <Grow in timeout={350}>
//                         <Box>
//                             <MultiEnvelopeDashboard
//                                 envelopes={envelopes}
//                                 contributions={contributions}
//                                 monthStart={monthStart}
//                                 monthEnd={monthEnd}
//                                 monthLabel={monthLabel}
//                                 planEntries={planEntries}
//                                 planResults={planResults}
//                                 planBudget={planBudget}
//                                 onBudgetChange={handlePlanBudgetChange}
//                                 onAlloc={handlePlanAlloc}
//                                 onLock={handlePlanLock}
//                                 onMoveUp={movePlanUp}
//                                 onMoveDown={movePlanDown}
//                                 onAutoReset={resetPlanToAuto}
//                                 onApplyPlan={handleApplyPlan}
//                             />
//                         </Box>
//                     </Grow>
//                 )}
//             </Container>
//
//             {/* ── Dialogs ──────────────────────────────────────────────────── */}
//             <ManualContributionDialog
//                 open={contribOpen}
//                 envelope={contribEnvelope}
//                 onClose={() => setContribOpen(false)}
//                 onSubmit={handleAddContribution}
//                 onSetupAuto={handleSetupAuto}
//             />
//             <AffordabilityDialog
//                 open={affordOpen}
//                 envelopes={activeEnvelopes}
//                 onClose={() => setAffordOpen(false)}
//                 onApplyAll={handleApplyAffordability}
//             />
//             <NotificationsDialog
//                 open={notifDialogOpen}
//                 onClose={() => setNotifDialogOpen(false)}
//                 subjectName={notifDialogTitle}
//                 notifications={[
//                     {
//                         id:        '1',
//                         date:      new Date().toISOString(),
//                         message:   'Contribution due — $200 scheduled for today',
//                         badge:     'Due today',
//                         badgeType: 'due',
//                         isRead:    false,
//                     },
//                     {
//                         id:        '2',
//                         date:      new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
//                         message:   'Saving pace is behind — need $340/mo to hit your deadline',
//                         badge:     'Falling behind',
//                         badgeType: 'behind',
//                         isRead:    false,
//                     },
//                     {
//                         id:        '3',
//                         date:      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
//                         message:   '$200 contribution added',
//                         badge:     'Read',
//                         badgeType: 'read',
//                         isRead:    true,
//                     },
//                     {
//                         id:        '4',
//                         date:      new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
//                         message:   'Goal milestone reached — 50% of target saved',
//                         badge:     'Goal',
//                         badgeType: 'goal',
//                         isRead:    true,
//                     },
//                 ]}
//                 onMarkAllRead={() => {
//                     setSnackMsg('All notifications marked as read');
//                     setSnackSev('success');
//                     setSnackOpen(true);
//                     setNotifDialogOpen(false);
//                 }}
//                 onAccept={(id) => {
//                     // TODO: wire to API — mark notification as accepted/actioned
//                     setSnackMsg('Notification accepted');
//                     setSnackSev('success');
//                     setSnackOpen(true);
//                 }}
//             />
//             <CreateEnvelopeDialog
//                 open={createOpen}
//                 onClose={() => setCreateOpen(false)}
//                 onSubmit={async (data: NewEnvelopeForm | NewEnvelopeForm[], isLinked: boolean) => {
//                     const forms = Array.isArray(data) ? data : [data];
//                     try {
//                         const criteria: NewEnvelopeCriteria[] = forms.map(f => ({
//                             goalType:            f.envelopeType as string,
//                             goalName:            f.envelopeName,
//                             envelopeType:        (f.envelopeType === '' ? 'FUND' : f.envelopeType) as EnvelopeType,
//                             description:         f.description ?? '',
//                             targetAmount:        f.targetAmount === '' ? 0 : f.targetAmount,
//                             initialContribution: f.startingAmount === '' ? 0 : f.startingAmount,
//                             startDate:           new Date().toISOString().split('T')[0],
//                             targetDate:          f.targetDate,
//                             autoContribution:    f.contributionMode === 'auto',
//                             frequency:           f.contributionFrequency,
//                             paymentInfo:         f.paymentInfo ?? null,
//                             score:               0,
//                             userId,
//                         }));
//                         const request: EnvelopeCreateRequest = { criteria, isLinked };
//                         await BudgetEnvelopeService.getInstance().createEnvelope(request, userId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]);
//                         const updated = await BudgetEnvelopeService.getInstance().fetchBudgetEnvelopes(userId, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]);
//                         setEnvelopes(updated);
//                         setSnackMsg(isLinked ? `${forms.length} linked envelopes created!` : 'Envelope created!');
//                         setSnackSev('success');
//                         setSnackOpen(true);
//                     } catch (err) {
//                         console.error('Failed to create envelope:', err);
//                         setSnackMsg('Failed to create envelope. Please try again.');
//                         setSnackSev('error');
//                         setSnackOpen(true);
//                     } finally {
//                         setCreateOpen(false);
//                     }
//                 }}
//             />
//
//             <LinkedGoalUpdateDialog
//                 open={linkedGoalDialogOpen}
//                 group={linkedGoalDialogGroup}
//                 onClose={() => { setLinkedGoalDialogOpen(false); setLinkedGoalDialogGroup(null); }}
//                 onSubmit={handleLinkedGoalUpdate}
//                 totalEnvelopes={envelopes.filter(e => e.status === 'ACTIVE').length}
//             />
//             <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
//                 <Alert onClose={() => setSnackOpen(false)} severity={snackSev} sx={{ width: '100%', borderRadius: 2 }}>{snackMsg}</Alert>
//             </Snackbar>
//         </Box>
//     );
// };
//
// export default BudgetEnvelopesPage;
