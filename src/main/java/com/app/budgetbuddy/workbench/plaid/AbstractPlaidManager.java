package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.request.PlaidApi;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public abstract class AbstractPlaidManager
{
    protected PlaidLinkService plaidLinkService;
    protected PlaidApi plaidApi;

    public AbstractPlaidManager(PlaidLinkService plaidLinkService,
                                @Qualifier("plaid") PlaidApi plaidApi)
    {
        this.plaidLinkService = plaidLinkService;
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

    protected Optional<PlaidLinkEntity> getPlaidLinkByUserId(Long userId){
        return null;
    }

    protected String getPlaidAccessToken(PlaidLinkEntity plaidLinkEntity){
        return null;
    }
}
