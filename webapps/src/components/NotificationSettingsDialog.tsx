import React from 'react';
import {
    alpha, Box, Button, Checkbox, Dialog, DialogContent,
    DialogTitle, Divider, FormControlLabel, IconButton,
    Stack, Switch, Typography,
} from '@mui/material';
import { Bell, Mail, Settings2, X as XIcon } from 'lucide-react';
import { MAROON } from '../config/Constants';
import { NotificationEventSettings, NotificationPrefs } from './NotificationToggle';

interface NotificationSettingsDialogProps {
    open:          boolean;
    onClose:       () => void;
    subjectName:   string;
    prefs:         NotificationPrefs;
    onTogglePref:  (channel: 'system' | 'email') => void;
    eventSettings: NotificationEventSettings;
    onToggleEvent: (key: keyof NotificationEventSettings) => void;
    onSave:        () => void;
}

const switchSx = {
    '& .MuiSwitch-switchBase.Mui-checked':                    { color: MAROON },
    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: MAROON },
};

const EVENT_ROWS: { key: keyof NotificationEventSettings; label: string }[] = [
    { key: 'contributionReceived', label: 'A contribution is added'       },
    { key: 'goalReached',          label: 'The goal is reached'           },
    { key: 'fallingBehind',        label: 'Saving falls behind pace'      },
    { key: 'monthlyReminder',      label: 'Monthly reminder to contribute' },
];

export const NotificationSettingsDialog: React.FC<NotificationSettingsDialogProps> = ({
                                                                                          open, onClose, subjectName, prefs, onTogglePref, eventSettings, onToggleEvent, onSave,
                                                                                      }) => (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
            PaperProps={{ sx: { borderRadius: '16px', border: `0.5px solid ${alpha(MAROON, 0.15)}` } }}>

        <DialogTitle sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', pb: 1.25 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                <Box sx={{ width: 30, height: 30, borderRadius: '8px', bgcolor: alpha(MAROON, 0.08), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Settings2 size={14} color={MAROON} />
                </Box>
                <Box>
                    <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#111' }}>Notification settings</Typography>
                    <Typography sx={{ fontSize: '0.68rem', color: '#888', mt: 0.1 }}>{subjectName}</Typography>
                </Box>
            </Box>
            <IconButton onClick={onClose} size="small" sx={{ mt: 0.25 }}>
                <XIcon size={14} />
            </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 0 }}>
            {/* Channels */}
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 1 }}>
                Alert me via
            </Typography>
            <Box sx={{ mb: 0.5 }}>
                {([
                    { channel: 'system' as const, icon: <Bell size={14} />,  label: 'System notifications', sub: 'In-app alerts'            },
                    { channel: 'email'  as const, icon: <Mail size={14} />,  label: 'Email',                sub: 'Sent to your account email' },
                ] as const).map(({ channel, icon, label, sub }) => (
                    <Box key={channel} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1, borderBottom: `0.5px solid #ebebeb`, '&:last-child': { borderBottom: 'none' } }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
                            <Box sx={{ color: '#555' }}>{icon}</Box>
                            <Box>
                                <Typography sx={{ fontSize: '0.78rem', color: '#111' }}>{label}</Typography>
                                <Typography sx={{ fontSize: '0.65rem', color: '#aaa', mt: 0.1 }}>{sub}</Typography>
                            </Box>
                        </Box>
                        <Switch checked={prefs[channel]} onChange={() => onTogglePref(channel)} sx={switchSx} size="small" />
                    </Box>
                ))}
            </Box>

            <Divider sx={{ my: 1.75 }} />

            {/* Events */}
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#aaa', mb: 0.5 }}>
                Notify me when
            </Typography>
            <Stack>
                {EVENT_ROWS.map(({ key, label }) => (
                    <Box key={key} sx={{ borderBottom: `0.5px solid #ebebeb`, '&:last-child': { borderBottom: 'none' } }}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={eventSettings[key]}
                                    onChange={() => onToggleEvent(key)}
                                    size="small"
                                    sx={{ color: '#ccc', '&.Mui-checked': { color: MAROON } }}
                                />
                            }
                            label={<Typography sx={{ fontSize: '0.78rem', color: '#333' }}>{label}</Typography>}
                            sx={{ mx: 0, py: 0.5, width: '100%' }}
                        />
                    </Box>
                ))}
            </Stack>

            <Button fullWidth variant="contained" onClick={() => { onSave(); onClose(); }}
                    sx={{ mt: 2, borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.78rem', bgcolor: MAROON, '&:hover': { bgcolor: alpha(MAROON, 0.85) } }}>
                Save settings
            </Button>
        </DialogContent>
    </Dialog>
);

export default NotificationSettingsDialog;