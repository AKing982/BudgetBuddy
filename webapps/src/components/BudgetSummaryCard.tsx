import React from "react";
import { Card, Box, Typography, Skeleton, Tooltip, IconButton } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { format } from "date-fns";

interface BudgetSummaryCardProps {
    title: string;
    amount: number;
    budgeted: number;
    currentMonth: Date;
    isCustom?: boolean;
    show_alert?: boolean;
    isLoading?: boolean;
    onAlertClick?: () => void;
}

const BudgetSummaryCard: React.FC<BudgetSummaryCardProps> = ({
                                                                 title,
                                                                 amount,
                                                                 budgeted,
                                                                 currentMonth,
                                                                 isCustom = false,
                                                                 show_alert = false,
                                                                 isLoading = false,
                                                                 onAlertClick,
                                                             }) => {
    const gradients = {
        blue: "#2196F3",
        aquaGreen: "#00BFA5",
        lightRed: "#FF5252",
    };

    const getBackground = () => {
        if (isLoading) {
            return gradients.blue;
        }

        if (title === "Total Budget") {
            return gradients.blue;
        }

        const usage = amount / budgeted;
        if (usage >= 1) {
            return gradients.lightRed;
        } else if (usage > 0.8) {
            return gradients.blue;
        } else {
            return gradients.aquaGreen;
        }
    };

    return (
        <Card
            sx={{
                p: 3,
                borderRadius: 4,
                height: "100%",
                background: getBackground(),
                color: "white",
                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.05)",
                position: "relative",
                overflow: "hidden",
                "&::after": {
                    content: '""',
                    position: "absolute",
                    top: 0,
                    right: 0,
                    width: "50%",
                    height: "100%",
                    backgroundImage:
                        "linear-gradient(to right, transparent, rgba(255, 255, 255, 0.1))",
                    transform: "skewX(-20deg) translateX(10%)",
                },
            }}
        >
            {show_alert && (
                <Box sx={{ position: "absolute", top: 8, right: 8, zIndex: 2 }}>
                    <Tooltip title="Budget Alert">
                        <IconButton
                            size="small"
                            onClick={onAlertClick}
                            sx={{
                                color: "inherit",
                                backgroundColor: "rgba(255, 255, 255, 0.15)",
                                "&:hover": {
                                    backgroundColor: "rgba(255, 255, 255, 0.25)",
                                },
                            }}
                        >
                            <NotificationsActiveIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Box>
            )}
            <Typography variant="subtitle2" sx={{ opacity: 0.8, mb: 1 }}>
                {title}
            </Typography>
            {isLoading ? (
                <Skeleton
                    variant="text"
                    width="80%"
                    height={48}
                    sx={{ bgcolor: "rgba(255, 255, 255, 0.2)" }}
                />
            ) : (
                <Typography variant="h4" sx={{ fontWeight: 700, mb: 0.5 }}>
                    {new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: "USD",
                    }).format(amount)}
                </Typography>
            )}
            <Typography variant="body2" sx={{ opacity: 0.8 }}>
                for {format(currentMonth, "MMMM yyyy")}
            </Typography>
        </Card>
    );
};

export default BudgetSummaryCard;