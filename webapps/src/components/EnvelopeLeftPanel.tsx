import React from 'react';
import { alpha, Box, Button, Divider, Grid, Stack, Typography } from '@mui/material';
import {
    Wallet, BarChart2, CreditCard, Sliders, Pencil, X as XIcon,
    AlertTriangle, PiggyBank,
} from 'lucide-react';

import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
import { MAROON, MAROON_DARK } from '../config/Constants';
import { fmt, monthlyContributed } from '../config/Helpers';
import EnvelopeCard from './EnvelopeCard';
import LinkedEnvelopeGroupCard from './LinkedEnvelopeGroupCard';
import InsightsPanel from './InsightsPanel';
import ChartsPanel from './ChartsPanel';
import PaymentPlanPanel from './PaymentPlanPanel';
import PaymentPlanAdjuster from './PaymentPlanAdjuster';
import { NotificationEventSettings, NotificationPrefs } from './NotificationToggle';

export type LeftPanelView = 'envelopes' | 'analytics' | 'paymentplan' | 'planadjuster';

interface EnvelopeLeftPanelProps {
    animateIn:              boolean;
    leftPanelView:          LeftPanelView;
    onSetLeftPanelView:     (view: LeftPanelView) => void;
    envelopePanelEditMode:  boolean;
    onToggleEditMode:       () => void;

    selectedEnvelope:       BudgetEnvelope | null;
    filtered:                BudgetEnvelope[];
    linkedEnvelopeGroups:    LinkedEnvelopeGroup[];
    individualEnvelopes:     BudgetEnvelope[];
    envelopes:               BudgetEnvelope[];
    contributions:            EnvelopeContribution[];
    selectedContributions:    EnvelopeContribution[];
    monthStart:              Date;
    monthEnd:                Date;
    monthLabel:              string;
    isLoading:               boolean;
    selectedId:              number | null;

    onSelectEnvelope:        (id: number | null) => void;
    onAddManual:             (id: number) => void;
    onSnack:                 (msg: string, sev: 'success' | 'error' | 'info' | 'warning') => void;

    getNotifPrefs:                    (key: number) => NotificationPrefs;
    onToggleEnvelopeNotification:     (envelopeId: number, channel: 'system' | 'email') => void;
    onToggleGroupNotification:        (groupId: number, memberIds: number[], channel: 'system' | 'email') => void;
    onOpenNotificationDialog:         (key: number, title: string, historyEnvelopes: BudgetEnvelope[]) => void;

    onSaveGroupEdit:          (groupId: number, newName: string, removedIds: number[], addedIds: number[]) => Promise<void> | void;
    onDissolveGroup:          (groupId: number) => Promise<void> | void;
    onOpenLinkedGoalUpdate:   (group: LinkedEnvelopeGroup) => void;
    /** Called when the user wants to view aggregated stats for a whole group in the right panel */
    onSelectGroup:            (group: LinkedEnvelopeGroup) => void;
    /** Id of the group currently shown as "group stats" in the right panel, if any */
    selectedGroupId:          number | null;

    onApplyPlanAdjustment:    (envelopeId: number, newMonthlyAllocation: number) => void;
}

// ── Shared style tokens — warm maroon-tinted surfaces, not stark white ─────
const SECTION_LABEL_SX = {
    fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.06em', color: '#a35c5c', mb: 1.25,
};
const BORDER   = `1px solid ${alpha(MAROON, 0.18)}`;
const PANEL_BG = '#fdf7f7';

const groupNotifKey = (groupId: number) => -groupId;

const EnvelopeLeftPanel: React.FC<EnvelopeLeftPanelProps> = ({
                                                                 animateIn, leftPanelView, onSetLeftPanelView, envelopePanelEditMode, onToggleEditMode,
                                                                 selectedEnvelope, filtered, linkedEnvelopeGroups, individualEnvelopes, envelopes,
                                                                 contributions, selectedContributions, monthStart, monthEnd, monthLabel, isLoading, selectedId,
                                                                 onSelectEnvelope, onAddManual, onSnack,
                                                                 getNotifPrefs, onToggleEnvelopeNotification, onToggleGroupNotification, onOpenNotificationDialog,
                                                                 onSaveGroupEdit, onDissolveGroup, onOpenLinkedGoalUpdate, onApplyPlanAdjustment,
                                                                 onSelectGroup, selectedGroupId,
                                                             }) => {
    const showPaymentTabs = selectedEnvelope?.envelopeType === 'PAYOFF' && !!selectedEnvelope?.paymentPlan;

    const individualList = filtered.filter(e => !e.linked);

    const tabs: { key: LeftPanelView; label: string; icon: React.ReactNode }[] = [
        { key: 'envelopes', label: 'Envelopes', icon: <Wallet size={13} /> },
        { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={13} /> },
        ...(showPaymentTabs
            ? [
                { key: 'paymentplan' as const,  label: 'Pay plan',    icon: <CreditCard size={13} /> },
                { key: 'planadjuster' as const, label: 'Adjust plan', icon: <Sliders size={13} /> },
            ]
            : []),
    ];

    const headerIcon = leftPanelView === 'envelopes'
        ? (envelopePanelEditMode ? <Pencil size={16} color={MAROON} /> : <Wallet size={16} color={MAROON} />)
        : leftPanelView === 'analytics' ? <BarChart2 size={16} color={MAROON} />
            : leftPanelView === 'planadjuster' ? <Sliders size={16} color={MAROON} />
                : <CreditCard size={16} color={MAROON} />;

    const headerTitle = leftPanelView === 'envelopes'
        ? (envelopePanelEditMode ? 'Edit envelopes' : 'Your envelopes')
        : leftPanelView === 'analytics' ? 'Analytics'
            : leftPanelView === 'planadjuster' ? `Adjust plan — ${selectedEnvelope?.envelopeName ?? ''}`
                : `Payment plan — ${selectedEnvelope?.envelopeName ?? ''}`;

    const headerSubtitle = leftPanelView === 'envelopes'
        ? (envelopePanelEditMode
            ? 'Manage group members — add or remove envelopes'
            : `${filtered.length} envelope${filtered.length !== 1 ? 's' : ''} active in ${monthLabel}`)
        : leftPanelView === 'analytics'
            ? 'Velocity, allocation, timeline and insights'
            : leftPanelView === 'planadjuster'
                ? 'Adjust your monthly payment and preview the payoff'
                : 'Schedule, acceleration simulator and amortization';

    return (
        <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: BORDER, bgcolor: PANEL_BG, boxShadow: '0 2px 12px rgba(122,31,43,0.1)' }}>

            {/* ── Header ──────────────────────────────────────────────────── */}
            <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`, px: 3, py: 2.25, position: 'relative', overflow: 'hidden' }}>
                <Box sx={{ position: 'absolute', top: -18, right: -18, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', position: 'relative' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
                        <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {React.cloneElement(headerIcon as React.ReactElement, { color: '#fff' })}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                            <Typography sx={{ fontWeight: 500, fontSize: '0.92rem', color: '#fff' }}>{headerTitle}</Typography>
                            <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{headerSubtitle}</Typography>
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                        {/* Edit / Exit edit — only on the envelopes view when there are linked groups */}
                        {leftPanelView === 'envelopes' && linkedEnvelopeGroups.length > 0 && (
                            <Button
                                size="small"
                                onClick={onToggleEditMode}
                                startIcon={envelopePanelEditMode ? <XIcon size={12} /> : <Pencil size={12} />}
                                sx={{
                                    borderRadius: '7px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem',
                                    px: 1.25, py: 0.5, border: '1px solid',
                                    ...(envelopePanelEditMode
                                        ? { bgcolor: 'rgba(255,255,255,0.92)', color: MAROON, borderColor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' } }
                                        : { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.22)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }),
                                }}
                            >
                                {envelopePanelEditMode ? 'Exit edit' : 'Edit'}
                            </Button>
                        )}

                        {/* View tabs */}
                        <Box sx={{ display: 'flex', p: '3px', borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.22)', gap: '2px' }}>
                            {tabs.map(({ key, label, icon }) => (
                                <Button key={key} size="small" onClick={() => onSetLeftPanelView(key)} startIcon={icon}
                                        sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', px: 1.25, py: 0.4, minWidth: 0, gap: 0.5,
                                            ...(leftPanelView === key
                                                ? { bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' } }
                                                : { bgcolor: 'transparent', color: 'rgba(255,255,255,0.6)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' } }) }}>
                                    {label}
                                </Button>
                            ))}
                        </Box>
                    </Box>
                </Box>
            </Box>

            {/* ── Envelopes view ──────────────────────────────────────────── */}
            {leftPanelView === 'envelopes' && (
                <Box sx={{ p: 2.5 }}>
                    {/* Linked groups — each group card carries its own border, header, and ring/grid
                        or funding-order body now, so it no longer needs a second tinted wrapper
                        around the whole section; that was doubling up on framing. */}
                    {linkedEnvelopeGroups.length > 0 && (
                        <>
                            <Typography sx={SECTION_LABEL_SX}>
                                Linked groups ({linkedEnvelopeGroups.length})
                                {envelopePanelEditMode && (
                                    <Box component="span" sx={{ ml: 1, color: MAROON, fontWeight: 500, textTransform: 'none', letterSpacing: 0, fontSize: '0.68rem' }}>
                                        — edit group members below
                                    </Box>
                                )}
                            </Typography>
                            <Stack spacing={1.5}>
                                {linkedEnvelopeGroups.map(group => (
                                    <LinkedEnvelopeGroupCard
                                        key={group.id}
                                        group={group}
                                        onSelectEnvelope={onSelectEnvelope}
                                        selectedId={selectedId}
                                        editMode={envelopePanelEditMode}
                                        onSaveGroupEdit={onSaveGroupEdit}
                                        onDissolveGroup={onDissolveGroup}
                                        availableEnvelopes={individualEnvelopes}
                                        groupNotificationPrefs={getNotifPrefs(groupNotifKey(group.id))}
                                        onToggleGroupNotification={(channel) => onToggleGroupNotification(group.id, group.envelopes.map(e => e.id), channel)}
                                        onOpenGroupNotificationSettings={() => onOpenNotificationDialog(groupNotifKey(group.id), group.linkName, group.envelopes)}
                                        getMemberNotificationPrefs={getNotifPrefs}
                                        onToggleMemberNotification={onToggleEnvelopeNotification}
                                        onOpenMemberNotificationSettings={(envelopeId) => {
                                            const member = group.envelopes.find(e => e.id === envelopeId);
                                            if (member) onOpenNotificationDialog(envelopeId, member.envelopeName, [member]);
                                        }}
                                        onOpenGoalUpdate={() => onOpenLinkedGoalUpdate(group)}
                                        onSelectGroup={() => onSelectGroup(group)}
                                        isGroupSelected={selectedGroupId === group.id}
                                    />
                                ))}
                            </Stack>
                            {individualList.length > 0 && <Divider sx={{ my: 2.5, borderColor: '#ecd9d9' }} />}
                        </>
                    )}

                    {/* Individual envelopes — unchanged grid, just with a count in the label to
                        match the linked section above so both read as peers, not a hierarchy. */}
                    {individualList.length > 0 && (
                        <>
                            <Typography sx={SECTION_LABEL_SX}>
                                Individual envelopes ({individualList.length})
                                {envelopePanelEditMode && (
                                    <Box component="span" sx={{ ml: 1, color: '#aaa', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.68rem', fontStyle: 'italic' }}>
                                        — tap + on a group above to move one here
                                    </Box>
                                )}
                            </Typography>
                            <Grid container spacing={1.5}>
                                {individualList.map((env, i) => (
                                    <Grid item xs={12} sm={6} key={env.id} sx={{ display: 'flex' }}>
                                        <EnvelopeCard
                                            envelope={env}
                                            animateIn={animateIn}
                                            timeout={700 + i * 80}
                                            contributions={contributions}
                                            monthContributed={monthlyContributed(contributions, env.id, monthStart, monthEnd)}
                                            onClick={() => !envelopePanelEditMode && onSelectEnvelope(env.id === selectedId ? null : env.id)}
                                            onAddManual={onAddManual}
                                            notificationPrefs={getNotifPrefs(env.id)}
                                            onToggleNotification={(channel) => onToggleEnvelopeNotification(env.id, channel)}
                                            onOpenNotificationSettings={() => onOpenNotificationDialog(env.id, env.envelopeName, [env])}
                                        />
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}

                    {filtered.length === 0 && !isLoading && (
                        <Box sx={{ textAlign: 'center', py: 4 }}>
                            <PiggyBank size={36} color={alpha(MAROON, 0.2)} />
                            <Typography sx={{ mt: 2, fontWeight: 500, color: '#555', fontSize: '0.85rem' }}>No envelopes active in {monthLabel}</Typography>
                            <Typography sx={{ mt: 0.5, fontSize: '0.78rem', color: '#aaa' }}>Try navigating to a different month or adjusting the filters above.</Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* ── Analytics view ──────────────────────────────────────────── */}
            {leftPanelView === 'analytics' && !isLoading && (
                <Box sx={{ p: 2.5 }}>
                    <InsightsPanel envelopes={envelopes} contributions={contributions} />
                    <ChartsPanel envelopes={envelopes} contributions={contributions} />
                </Box>
            )}

            {/* ── Payment plan view ────────────────────────────────────────── */}
            {leftPanelView === 'paymentplan' && selectedEnvelope?.paymentPlan && (
                <Box sx={{ p: 2.5 }}>
                    {selectedEnvelope.paymentPlan.isDeferred && (
                        <Box sx={{ mb: 2.5, p: 1.5, borderRadius: '8px', border: `1px solid ${alpha('#dc2626', 0.25)}`, display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
                            <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha('#dc2626', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                <AlertTriangle size={14} color="#dc2626" />
                            </Box>
                            <Box>
                                <Typography sx={{ fontWeight: 500, fontSize: '0.82rem', color: '#dc2626' }}>
                                    Deferred interest at risk: {fmt(selectedEnvelope.paymentPlan.deferredInterest)}
                                </Typography>
                                <Typography sx={{ fontSize: '0.72rem', color: '#a34848', mt: 0.3, lineHeight: 1.5 }}>
                                    If {fmt(selectedEnvelope.remainingAmount)} isn't cleared by {selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}, the full 26.99% APR back-interest applies from the original purchase date.
                                </Typography>
                            </Box>
                        </Box>
                    )}
                    <PaymentPlanPanel envelope={selectedEnvelope} contributions={selectedContributions} />
                </Box>
            )}

            {/* ── Plan adjuster view ───────────────────────────────────────── */}
            {leftPanelView === 'planadjuster' && selectedEnvelope?.paymentPlan && (
                <Box sx={{ p: 2.5 }}>
                    <PaymentPlanAdjuster
                        envelope={selectedEnvelope}
                        contributions={selectedContributions}
                        onApply={(envelopeId, newMonthlyAllocation) => {
                            onApplyPlanAdjustment(envelopeId, newMonthlyAllocation);
                            onSnack('Payment schedule updated!', 'success');
                        }}
                    />
                </Box>
            )}
        </Box>
    );
};

export default EnvelopeLeftPanel;

// import React from 'react';
// import { alpha, Box, Button, Divider, Grid, Typography } from '@mui/material';
// import {
//     Wallet, BarChart2, CreditCard, Sliders, Pencil, X as XIcon,
//     AlertTriangle, PiggyBank,
// } from 'lucide-react';
//
// import { BudgetEnvelope, EnvelopeContribution } from '../config/Types';
// import { LinkedEnvelopeGroup } from '../services/BudgetEnvelopeService';
// import { MAROON, MAROON_DARK } from '../config/Constants';
// import { fmt, monthlyContributed } from '../config/Helpers';
// import EnvelopeCard from './EnvelopeCard';
// import LinkedEnvelopeGroupCard from './LinkedEnvelopeGroupCard';
// import InsightsPanel from './InsightsPanel';
// import ChartsPanel from './ChartsPanel';
// import PaymentPlanPanel from './PaymentPlanPanel';
// import PaymentPlanAdjuster from './PaymentPlanAdjuster';
// import { NotificationEventSettings, NotificationPrefs } from './NotificationToggle';
//
// export type LeftPanelView = 'envelopes' | 'analytics' | 'paymentplan' | 'planadjuster';
//
// interface EnvelopeLeftPanelProps {
//     animateIn:              boolean;
//     leftPanelView:          LeftPanelView;
//     onSetLeftPanelView:     (view: LeftPanelView) => void;
//     envelopePanelEditMode:  boolean;
//     onToggleEditMode:       () => void;
//
//     selectedEnvelope:       BudgetEnvelope | null;
//     filtered:                BudgetEnvelope[];
//     linkedEnvelopeGroups:    LinkedEnvelopeGroup[];
//     individualEnvelopes:     BudgetEnvelope[];
//     envelopes:               BudgetEnvelope[];
//     contributions:            EnvelopeContribution[];
//     selectedContributions:    EnvelopeContribution[];
//     monthStart:              Date;
//     monthEnd:                Date;
//     monthLabel:              string;
//     isLoading:               boolean;
//     selectedId:              number | null;
//
//     onSelectEnvelope:        (id: number | null) => void;
//     onAddManual:             (id: number) => void;
//     onSnack:                 (msg: string, sev: 'success' | 'error' | 'info' | 'warning') => void;
//
//     getNotifPrefs:                    (key: number) => NotificationPrefs;
//     onToggleEnvelopeNotification:     (envelopeId: number, channel: 'system' | 'email') => void;
//     onToggleGroupNotification:        (groupId: number, memberIds: number[], channel: 'system' | 'email') => void;
//     onOpenNotificationDialog:         (key: number, title: string, historyEnvelopes: BudgetEnvelope[]) => void;
//
//     onSaveGroupEdit:          (groupId: number, newName: string, removedIds: number[], addedIds: number[]) => Promise<void> | void;
//     onDissolveGroup:          (groupId: number) => Promise<void> | void;
//     onOpenLinkedGoalUpdate:   (group: LinkedEnvelopeGroup) => void;
//     /** Called when the user wants to view aggregated stats for a whole group in the right panel */
//     onSelectGroup:            (group: LinkedEnvelopeGroup) => void;
//     /** Id of the group currently shown as "group stats" in the right panel, if any */
//     selectedGroupId:          number | null;
//
//     onApplyPlanAdjustment:    (envelopeId: number, newMonthlyAllocation: number) => void;
// }
//
// // ── Shared style tokens — warm maroon-tinted surfaces, not stark white ─────
// const SECTION_LABEL_SX = {
//     fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase' as const,
//     letterSpacing: '0.06em', color: '#a35c5c', mb: 1.25,
// };
// const BORDER   = `1px solid ${alpha(MAROON, 0.18)}`;
// const PANEL_BG = '#fdf7f7';
//
// const groupNotifKey = (groupId: number) => -groupId;
//
// const EnvelopeLeftPanel: React.FC<EnvelopeLeftPanelProps> = ({
//                                                                  animateIn, leftPanelView, onSetLeftPanelView, envelopePanelEditMode, onToggleEditMode,
//                                                                  selectedEnvelope, filtered, linkedEnvelopeGroups, individualEnvelopes, envelopes,
//                                                                  contributions, selectedContributions, monthStart, monthEnd, monthLabel, isLoading, selectedId,
//                                                                  onSelectEnvelope, onAddManual, onSnack,
//                                                                  getNotifPrefs, onToggleEnvelopeNotification, onToggleGroupNotification, onOpenNotificationDialog,
//                                                                  onSaveGroupEdit, onDissolveGroup, onOpenLinkedGoalUpdate, onApplyPlanAdjustment,
//                                                                  onSelectGroup, selectedGroupId,
//                                                              }) => {
//     const showPaymentTabs = selectedEnvelope?.envelopeType === 'PAYOFF' && !!selectedEnvelope?.paymentPlan;
//
//     const tabs: { key: LeftPanelView; label: string; icon: React.ReactNode }[] = [
//         { key: 'envelopes', label: 'Envelopes', icon: <Wallet size={13} /> },
//         { key: 'analytics', label: 'Analytics', icon: <BarChart2 size={13} /> },
//         ...(showPaymentTabs
//             ? [
//                 { key: 'paymentplan' as const,  label: 'Pay plan',    icon: <CreditCard size={13} /> },
//                 { key: 'planadjuster' as const, label: 'Adjust plan', icon: <Sliders size={13} /> },
//             ]
//             : []),
//     ];
//
//     const headerIcon = leftPanelView === 'envelopes'
//         ? (envelopePanelEditMode ? <Pencil size={16} color={MAROON} /> : <Wallet size={16} color={MAROON} />)
//         : leftPanelView === 'analytics' ? <BarChart2 size={16} color={MAROON} />
//             : leftPanelView === 'planadjuster' ? <Sliders size={16} color={MAROON} />
//                 : <CreditCard size={16} color={MAROON} />;
//
//     const headerTitle = leftPanelView === 'envelopes'
//         ? (envelopePanelEditMode ? 'Edit envelopes' : 'Your envelopes')
//         : leftPanelView === 'analytics' ? 'Analytics'
//             : leftPanelView === 'planadjuster' ? `Adjust plan — ${selectedEnvelope?.envelopeName ?? ''}`
//                 : `Payment plan — ${selectedEnvelope?.envelopeName ?? ''}`;
//
//     const headerSubtitle = leftPanelView === 'envelopes'
//         ? (envelopePanelEditMode
//             ? 'Manage group members — add or remove envelopes'
//             : `${filtered.length} envelope${filtered.length !== 1 ? 's' : ''} active in ${monthLabel}`)
//         : leftPanelView === 'analytics'
//             ? 'Velocity, allocation, timeline and insights'
//             : leftPanelView === 'planadjuster'
//                 ? 'Adjust your monthly payment and preview the payoff'
//                 : 'Schedule, acceleration simulator and amortization';
//
//     return (
//         <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: BORDER, bgcolor: PANEL_BG, boxShadow: '0 2px 12px rgba(122,31,43,0.1)' }}>
//
//             {/* ── Header ──────────────────────────────────────────────────── */}
//             <Box sx={{ background: `linear-gradient(135deg, ${MAROON_DARK} 0%, ${MAROON} 50%, #5a1515 100%)`, px: 3, py: 2.25, position: 'relative', overflow: 'hidden' }}>
//                 <Box sx={{ position: 'absolute', top: -18, right: -18, width: 90, height: 90, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.07)' }} />
//                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1.5, flexWrap: 'wrap', position: 'relative' }}>
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, minWidth: 0 }}>
//                         <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                             {React.cloneElement(headerIcon as React.ReactElement, { color: '#fff' })}
//                         </Box>
//                         <Box sx={{ minWidth: 0 }}>
//                             <Typography sx={{ fontWeight: 500, fontSize: '0.92rem', color: '#fff' }}>{headerTitle}</Typography>
//                             <Typography sx={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.7)', mt: 0.1 }}>{headerSubtitle}</Typography>
//                         </Box>
//                     </Box>
//
//                     <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
//                         {/* Edit / Exit edit — only on the envelopes view when there are linked groups */}
//                         {leftPanelView === 'envelopes' && linkedEnvelopeGroups.length > 0 && (
//                             <Button
//                                 size="small"
//                                 onClick={onToggleEditMode}
//                                 startIcon={envelopePanelEditMode ? <XIcon size={12} /> : <Pencil size={12} />}
//                                 sx={{
//                                     borderRadius: '7px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem',
//                                     px: 1.25, py: 0.5, border: '1px solid',
//                                     ...(envelopePanelEditMode
//                                         ? { bgcolor: 'rgba(255,255,255,0.92)', color: MAROON, borderColor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' } }
//                                         : { bgcolor: 'rgba(255,255,255,0.12)', color: '#fff', borderColor: 'rgba(255,255,255,0.22)', '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } }),
//                                 }}
//                             >
//                                 {envelopePanelEditMode ? 'Exit edit' : 'Edit'}
//                             </Button>
//                         )}
//
//                         {/* View tabs */}
//                         <Box sx={{ display: 'flex', p: '3px', borderRadius: '8px', bgcolor: 'rgba(0,0,0,0.22)', gap: '2px' }}>
//                             {tabs.map(({ key, label, icon }) => (
//                                 <Button key={key} size="small" onClick={() => onSetLeftPanelView(key)} startIcon={icon}
//                                         sx={{ borderRadius: '6px', textTransform: 'none', fontWeight: 500, fontSize: '0.72rem', px: 1.25, py: 0.4, minWidth: 0, gap: 0.5,
//                                             ...(leftPanelView === key
//                                                 ? { bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.24)' } }
//                                                 : { bgcolor: 'transparent', color: 'rgba(255,255,255,0.6)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)', color: '#fff' } }) }}>
//                                     {label}
//                                 </Button>
//                             ))}
//                         </Box>
//                     </Box>
//                 </Box>
//             </Box>
//
//             {/* ── Envelopes view ──────────────────────────────────────────── */}
//             {leftPanelView === 'envelopes' && (
//                 <Box sx={{ p: 2.5 }}>
//                     {linkedEnvelopeGroups.length > 0 && (
//                         <>
//                             <Typography sx={SECTION_LABEL_SX}>
//                                 Linked groups
//                                 {envelopePanelEditMode && (
//                                     <Box component="span" sx={{ ml: 1, color: MAROON, fontWeight: 500, textTransform: 'none', letterSpacing: 0, fontSize: '0.68rem' }}>
//                                         — edit group members below
//                                     </Box>
//                                 )}
//                             </Typography>
//                             {/* Grouped-section wrapper — a single tinted surface the group cards sit inside,
//                                 instead of floating loose against the panel background. Purely a container;
//                                 LinkedEnvelopeGroupCard's own internals are untouched. */}
//                             <Box sx={{ p: 1.25, borderRadius: '12px', bgcolor: alpha(MAROON, 0.035), border: `1px solid ${alpha(MAROON, 0.1)}` }}>
//                                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
//                                     {linkedEnvelopeGroups.map(group => (
//                                         <LinkedEnvelopeGroupCard
//                                             key={group.id}
//                                             group={group}
//                                             onSelectEnvelope={onSelectEnvelope}
//                                             selectedId={selectedId}
//                                             editMode={envelopePanelEditMode}
//                                             onSaveGroupEdit={onSaveGroupEdit}
//                                             onDissolveGroup={onDissolveGroup}
//                                             availableEnvelopes={individualEnvelopes}
//                                             groupNotificationPrefs={getNotifPrefs(groupNotifKey(group.id))}
//                                             onToggleGroupNotification={(channel) => onToggleGroupNotification(group.id, group.envelopes.map(e => e.id), channel)}
//                                             onOpenGroupNotificationSettings={() => onOpenNotificationDialog(groupNotifKey(group.id), group.linkName, group.envelopes)}
//                                             getMemberNotificationPrefs={getNotifPrefs}
//                                             onToggleMemberNotification={onToggleEnvelopeNotification}
//                                             onOpenMemberNotificationSettings={(envelopeId) => {
//                                                 const member = group.envelopes.find(e => e.id === envelopeId);
//                                                 if (member) onOpenNotificationDialog(envelopeId, member.envelopeName, [member]);
//                                             }}
//                                             onOpenGoalUpdate={() => onOpenLinkedGoalUpdate(group)}
//                                             onSelectGroup={() => onSelectGroup(group)}
//                                             isGroupSelected={selectedGroupId === group.id}
//                                         />
//                                     ))}
//                                 </Box>
//                             </Box>
//                             <Divider sx={{ my: 2 }} />
//                         </>
//                     )}
//
//                     {filtered.filter(e => !e.linked).length > 0 && (
//                         <>
//                             <Typography sx={SECTION_LABEL_SX}>
//                                 Individual envelopes
//                                 {envelopePanelEditMode && (
//                                     <Box component="span" sx={{ ml: 1, color: '#aaa', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: '0.68rem', fontStyle: 'italic' }}>
//                                         — tap + on a group above to move one here
//                                     </Box>
//                                 )}
//                             </Typography>
//                             {/* Tightened from spacing={2} to 1.5 — denser grid, closer to how the
//                                 cards read in the Variant A preview. */}
//                             <Grid container spacing={1.5}>
//                                 {filtered.filter(e => !e.linked).map((env, i) => (
//                                     <Grid item xs={12} sm={6} key={env.id} sx={{ display: 'flex' }}>
//                                         <EnvelopeCard
//                                             envelope={env}
//                                             animateIn={animateIn}
//                                             timeout={700 + i * 80}
//                                             contributions={contributions}
//                                             monthContributed={monthlyContributed(contributions, env.id, monthStart, monthEnd)}
//                                             onClick={() => !envelopePanelEditMode && onSelectEnvelope(env.id === selectedId ? null : env.id)}
//                                             onAddManual={onAddManual}
//                                             notificationPrefs={getNotifPrefs(env.id)}
//                                             onToggleNotification={(channel) => onToggleEnvelopeNotification(env.id, channel)}
//                                             onOpenNotificationSettings={() => onOpenNotificationDialog(env.id, env.envelopeName, [env])}
//                                         />
//                                     </Grid>
//                                 ))}
//                             </Grid>
//                         </>
//                     )}
//
//                     {filtered.length === 0 && !isLoading && (
//                         <Box sx={{ textAlign: 'center', py: 4 }}>
//                             <PiggyBank size={36} color={alpha(MAROON, 0.2)} />
//                             <Typography sx={{ mt: 2, fontWeight: 500, color: '#555', fontSize: '0.85rem' }}>No envelopes active in {monthLabel}</Typography>
//                             <Typography sx={{ mt: 0.5, fontSize: '0.78rem', color: '#aaa' }}>Try navigating to a different month or adjusting the filters above.</Typography>
//                         </Box>
//                     )}
//                 </Box>
//             )}
//
//             {/* ── Analytics view ──────────────────────────────────────────── */}
//             {leftPanelView === 'analytics' && !isLoading && (
//                 <Box sx={{ p: 2.5 }}>
//                     <InsightsPanel envelopes={envelopes} contributions={contributions} />
//                     <ChartsPanel envelopes={envelopes} contributions={contributions} />
//                 </Box>
//             )}
//
//             {/* ── Payment plan view ────────────────────────────────────────── */}
//             {leftPanelView === 'paymentplan' && selectedEnvelope?.paymentPlan && (
//                 <Box sx={{ p: 2.5 }}>
//                     {selectedEnvelope.paymentPlan.isDeferred && (
//                         <Box sx={{ mb: 2.5, p: 1.5, borderRadius: '8px', border: `1px solid ${alpha('#dc2626', 0.25)}`, display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
//                             <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha('#dc2626', 0.1), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
//                                 <AlertTriangle size={14} color="#dc2626" />
//                             </Box>
//                             <Box>
//                                 <Typography sx={{ fontWeight: 500, fontSize: '0.82rem', color: '#dc2626' }}>
//                                     Deferred interest at risk: {fmt(selectedEnvelope.paymentPlan.deferredInterest)}
//                                 </Typography>
//                                 <Typography sx={{ fontSize: '0.72rem', color: '#a34848', mt: 0.3, lineHeight: 1.5 }}>
//                                     If {fmt(selectedEnvelope.remainingAmount)} isn't cleared by {selectedEnvelope.targetDate ? new Date(selectedEnvelope.targetDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '—'}, the full 26.99% APR back-interest applies from the original purchase date.
//                                 </Typography>
//                             </Box>
//                         </Box>
//                     )}
//                     <PaymentPlanPanel envelope={selectedEnvelope} contributions={selectedContributions} />
//                 </Box>
//             )}
//
//             {/* ── Plan adjuster view ───────────────────────────────────────── */}
//             {leftPanelView === 'planadjuster' && selectedEnvelope?.paymentPlan && (
//                 <Box sx={{ p: 2.5 }}>
//                     <PaymentPlanAdjuster
//                         envelope={selectedEnvelope}
//                         contributions={selectedContributions}
//                         onApply={(envelopeId, newMonthlyAllocation) => {
//                             onApplyPlanAdjustment(envelopeId, newMonthlyAllocation);
//                             onSnack('Payment schedule updated!', 'success');
//                         }}
//                     />
//                 </Box>
//             )}
//         </Box>
//     );
// };
//
// export default EnvelopeLeftPanel;