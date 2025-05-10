import React from "react";
import {useNavigate} from "react-router-dom";
import { Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import UserLogService from "../services/UserLogService";

interface SidebarMenuItem {
    text: string;
    path: string;
}

interface SideBarMenuItemProps {
    isOpen: boolean;
    onClose: () => void;
}

const SidebarMenu: React.FC<SideBarMenuItemProps> = ({isOpen, onClose}) => {
    const navigate = useNavigate();
    const userLogService = UserLogService.getInstance();

    const menuItems = [
        {text: 'Profile', path: '/profile'},
        {text: 'Linked Accounts', path: '/linked-accounts'},
        {text: 'Logout', path:'/'}
    ]

    const handleItemClick = async (item: SidebarMenuItem) => {
        if(item.text === 'Logout'){
            await handleLogout();
        }else{
            navigate(item.path);
        }
        onClose();
    }

    const handleLogout = async () => {
        try {
            // Get the current user ID from session storage
            const userId = sessionStorage.getItem('userId');

            if (userId) {
                // Get the active user log for this user
                const activeUserLog = await userLogService.fetchActiveUserLogByUserId(Number(userId));

                if (activeUserLog) {
                    // Update the user log with logout information
                    const currentTime = new Date();
                    const loginTime = new Date(activeUserLog.lastLogin);

                    // Calculate session duration in seconds
                    const sessionDuration = Math.floor((currentTime.getTime() - loginTime.getTime()) / 1000);

                    // Update the user log
                    await userLogService.updateUserLog(activeUserLog.id, {
                        lastLogout: currentTime.getTime(),
                        sessionDuration: sessionDuration,
                        isActive: false
                    });

                    console.log('User log updated on logout:', {
                        userId: activeUserLog.userId,
                        sessionDuration: sessionDuration,
                        logoutTime: currentTime
                    });
                } else {
                    console.warn('No active user log found for logout');
                }

                // Clear session storage
                sessionStorage.clear();
            }

            // Navigate to login page
            navigate('/');

        } catch (error) {
            console.error('Error during logout:', error);
            // Still navigate to login page even if there's an error
            sessionStorage.clear();
            navigate('/');
        }
    };

    if (!isOpen) return null


    return (
        <Paper
            elevation={3}
            sx={{
                width: 200,
                position: 'absolute',
                top: '60px', // Adjust based on your layout
                right: '-50px', // Adjust based on your layout
                zIndex: 1000,
            }}
        >
            <List>
                {menuItems.map((item, index) => (
                    <React.Fragment key={item.text}>
                        <ListItem
                            button
                            onClick={() => handleItemClick(item)}
                            sx={{
                                py: 1,
                                '&:hover': {
                                    backgroundColor: 'action.hover',
                                },
                            }}
                        >
                            <ListItemText
                                primary={item.text}
                                primaryTypographyProps={{
                                    fontSize: '0.9rem',
                                    fontWeight: item.text === 'Logout' ? 'bold' : 'normal',
                                }}
                            />
                        </ListItem>
                        {index < menuItems.length - 1 && index !== menuItems.length - 2 && (
                            <Divider variant="middle" component="li" />
                        )}
                    </React.Fragment>
                ))}
            </List>
        </Paper>
    );
}
export default SidebarMenu;