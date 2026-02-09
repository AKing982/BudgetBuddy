package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.exceptions.DataException;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;
import lombok.extern.slf4j.Slf4j;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Getter
@Setter
@Slf4j
public class UserSecurity
{
    private Long id;
    private Long userId;
    private int accessLevel;
    private boolean enable_csv_upload;
    private boolean enable_plaid_sync;
    private boolean enable_2fa_auth;
    private boolean enable_email_notifications;
    private boolean enable_user;
    private List<BudgetFeature> budgetFeatureAccess = new ArrayList<>();

    public List<BudgetFeature> getUserBudgetFeaturesByAccessLevel(int accessLevel)
    {
        if(accessLevel == 0)
        {
            return Collections.emptyList();
        }
        try
        {
            return budgetFeatureAccess.stream()
                    .filter(feature -> feature.accessLevel() == accessLevel)
                    .toList();
        }catch(DataException ex){
            log.error("There was an error fetching the budget features for userId {} with access level {}: {}", userId, accessLevel, ex.getMessage());
            return Collections.emptyList();
        }
    }
}
