import React from "react";
import {useNavigate} from "react-router-dom";
import { Paper, List, ListItem, ListItemText, Divider } from '@mui/material';

interface SidebarMenuItem {
    text: string;
    path: string;
}

const SidebarMenu: React.FC = () => {
    const navigate = useNavigate();

    const menuItems = [
        {text: 'Profile', path: '/profile'},
        {text: 'Linked Accounts', path: '/linked-accounts'},
        {text: 'Logout', path:'/'}
    ]

    const handleItemClick = (path: string) => {
        navigate(path);
    }

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
                            onClick={() => handleItemClick(item.path)}
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