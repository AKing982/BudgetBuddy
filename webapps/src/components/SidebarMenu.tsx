import React from "react";
import {useNavigate} from "react-router-dom";
import { Paper, List, ListItem, ListItemText, Divider } from '@mui/material';
import SessionService from "../services/SessionService";
import UserLogService from "../services/UserLogService";
import {log} from "node:util";

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
        try
        {


            // 2. Clear all client-side storage
            sessionStorage.clear();
            localStorage.clear();

            // 4. Navigate to login page
            navigate('/');
            console.log('Logout completed successfully');

        } catch (error) {
            console.error('Error during logout:', error);

            // Even if backend logout fails, clear local data and redirect
            sessionStorage.clear();
            localStorage.clear();
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