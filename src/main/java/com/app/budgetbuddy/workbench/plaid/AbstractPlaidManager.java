package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.UserService;
import com.plaid.client.request.PlaidApi;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public abstract class AbstractPlaidManager
{
    protected PlaidLinkService plaidLinkService;
    protected UserService userService;
    protected PlaidApi plaidApi;
    protected int MAX_ATTEMPTS = 5;

    public AbstractPlaidManager(PlaidLinkService plaidLinkService,
                                UserService userService,
                                @Qualifier("plaid") PlaidApi plaidApi)
    {
        this.plaidLinkService = plaidLinkService;
        this.userService = userService;
        this.plaidApi = plaidApi;
    }

    protected List<PlaidLinkEntity> findPlaidLinkByUserId(Long userId)
    {
        if(userId == null){
            throw new InvalidUserIDException("Invalid user ID.");
        }
        return plaidLinkService.findPlaidLinkByUserID(userId);
    }

    protected String getPlaidAccessToken(PlaidLinkEntity plaidLinkEntity){
        return plaidLinkEntity.getAccessToken();
    }
}
