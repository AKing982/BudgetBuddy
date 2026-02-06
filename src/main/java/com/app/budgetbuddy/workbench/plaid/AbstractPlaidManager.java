package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.UserService;
import com.plaid.client.request.PlaidApi;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

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

    protected PlaidLinkEntity findPlaidLinkByUserId(Long userId){
        if(userId == null){
            throw new InvalidUserIDException("Invalid user ID.");
        }
        Optional<PlaidLinkEntity> plaidLinkOptional = plaidLinkService.findPlaidLinkByUserID(userId);
        if(plaidLinkOptional.isEmpty()){
            throw new PlaidLinkException("No plaid link found for userID: " + userId);
        }
        return plaidLinkOptional.get();
    }

    protected String getPlaidAccessToken(PlaidLinkEntity plaidLinkEntity){
        return plaidLinkEntity.getAccessToken();
    }
}
