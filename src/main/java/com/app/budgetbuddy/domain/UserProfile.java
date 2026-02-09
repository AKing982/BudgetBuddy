package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.exceptions.UserNotFoundException;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class UserProfile
{
    private Long profileId;
    private User user;
    private String profileImage;
    private String planType;
    private boolean enable_auto_categorization;
    private boolean enable_game_mode;
    private List<EmailNotifications> emailNotifications = new ArrayList<>();
    private UserSecurity userSecurity;

    public UserProfile(User user, String plan)
    {
        if(user == null)
        {
            throw new UserNotFoundException("User not found... Unable to load user profile.");
        }
        this.user = user;
        this.planType = plan;
        this.userSecurity = loadUserSecurityByPlan(planType, user.getId());
    }

    public String loadUserProfileImage(Long userId)
    {
        return "";
    }

    // TODO: Use EmailNotificationsService for this
    public List<EmailNotifications> loadEmailNotifications(Long userId)
    {
        return Collections.emptyList();
    }

    // TODO: User UserSecurityService for this
    public UserSecurity loadUserSecurityByPlan(String planType, Long userId)
    {
        return null;
    }
}
