import React from 'react';
import { Box, IconButton, Tooltip } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { Bell, Mail } from 'lucide-react';
import { MAROON } from '../config/Constants';

/** Per-envelope (or per-group) notification channel state */
export interface NotificationPrefs {
    system: boolean;
    email: boolean;
}

/** Which envelope events should trigger an alert, independent of channel */
export interface NotificationEventSettings {
    contributionReceived: boolean;
    goalReached:          boolean;
    fallingBehind:        boolean;
    monthlyReminder:      boolean;
}

export const DEFAULT_NOTIFICATION_EVENT_SETTINGS: NotificationEventSettings = {
    contributionReceived: true,
    goalReached:          true,
    fallingBehind:        true,
    monthlyReminder:      false,
};

interface NotificationToggleProps {
    prefs:    NotificationPrefs;
    onToggle: (channel: 'system' | 'email') => void;
    /** Fires right after the toggle, so the caller can open the settings/history dialog for this envelope or group */
    onOpenSettings?: (channel: 'system' | 'email') => void;
    size?: number;
}

/**
 * Two small independent icon buttons — a bell for in-app/system alerts and an
 * envelope for email alerts — that report on an envelope's (or group's)
 * status and contribution activity. Clicking either one flips that channel
 * on/off AND opens the combined settings/history dialog (via onOpenSettings),
 * so a single tap both adjusts the channel and gives access to the finer
 * per-event controls and recent activity log.
 *
 * Designed to sit inside a clickable card header, so clicks here are
 * stopped from bubbling up to the card's own onClick (envelope selection).
 */
const NotificationToggle: React.FC<NotificationToggleProps> = ({ prefs, onToggle, onOpenSettings, size = 14 }) => {
    const btnSx = (active: boolean) => ({
        width: 26,
        height: 26,
        borderRadius: '7px',
        bgcolor: active ? alpha(MAROON, 0.12) : 'transparent',
        color: active ? MAROON : '#b5b5b5',
        transition: 'all 0.15s',
        '&:hover': {
            bgcolor: active ? alpha(MAROON, 0.2) : alpha('#000', 0.05),
            color: active ? MAROON : '#888',
        },
    });

    const handleClick = (channel: 'system' | 'email') => {
        onToggle(channel);
        onOpenSettings?.(channel);
    };

    return (
        <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
            <Tooltip title={prefs.system ? 'System notifications on — tap for settings' : 'System notifications off — tap to turn on'}>
                <IconButton size="small" onClick={() => handleClick('system')} sx={btnSx(prefs.system)}>
                    <Bell size={size} fill={prefs.system ? MAROON : 'none'} strokeWidth={2} />
                </IconButton>
            </Tooltip>
            <Tooltip title={prefs.email ? 'Email notifications on — tap for settings' : 'Email notifications off — tap to turn on'}>
                <IconButton size="small" onClick={() => handleClick('email')} sx={btnSx(prefs.email)}>
                    <Mail size={size} fill={prefs.email ? MAROON : 'none'} strokeWidth={2} />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default NotificationToggle;

// import React from 'react';
// import { Box, IconButton, Tooltip } from '@mui/material';
// import { alpha } from '@mui/material/styles';
// import { Bell, Mail } from 'lucide-react';
// import { MAROON } from '../config/Constants';
//
// /** Per-envelope (or per-group) notification channel state */
// export interface NotificationPrefs {
//     system: boolean;
//     email: boolean;
// }
//
// interface NotificationToggleProps {
//     prefs: NotificationPrefs;
//     onToggle: (channel: 'system' | 'email') => void;
//     size?: number;
// }
//
// /**
//  * Two small independent icon buttons — a bell for in-app/system alerts and an
//  * envelope for email alerts — that report on an envelope's (or group's)
//  * status and contribution activity. Each channel toggles on its own, so a
//  * user can have system-only, email-only, both, or neither.
//  *
//  * Designed to sit inside a clickable card header, so clicks here are
//  * stopped from bubbling up to the card's own onClick (envelope selection).
//  */
// const NotificationToggle: React.FC<NotificationToggleProps> = ({ prefs, onToggle, size = 14 }) => {
//     const btnSx = (active: boolean) => ({
//         width: 26,
//         height: 26,
//         borderRadius: '7px',
//         bgcolor: active ? alpha(MAROON, 0.12) : 'transparent',
//         color: active ? MAROON : '#b5b5b5',
//         transition: 'all 0.15s',
//         '&:hover': {
//             bgcolor: active ? alpha(MAROON, 0.2) : alpha('#000', 0.05),
//             color: active ? MAROON : '#888',
//         },
//     });
//
//     return (
//         <Box sx={{ display: 'flex', gap: 0.5 }} onClick={(e) => e.stopPropagation()}>
//             <Tooltip title={prefs.system ? 'System notifications on — tap to turn off' : 'System notifications off — tap to turn on'}>
//                 <IconButton size="small" onClick={() => onToggle('system')} sx={btnSx(prefs.system)}>
//                     <Bell size={size} fill={prefs.system ? MAROON : 'none'} strokeWidth={2} />
//                 </IconButton>
//             </Tooltip>
//             <Tooltip title={prefs.email ? 'Email notifications on — tap to turn off' : 'Email notifications off — tap to turn on'}>
//                 <IconButton size="small" onClick={() => onToggle('email')} sx={btnSx(prefs.email)}>
//                     <Mail size={size} fill={prefs.email ? MAROON : 'none'} strokeWidth={2} />
//                 </IconButton>
//             </Tooltip>
//         </Box>
//     );
// };
//
// export default NotificationToggle;