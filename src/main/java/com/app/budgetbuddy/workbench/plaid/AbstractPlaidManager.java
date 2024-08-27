package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.request.PlaidApi;

import java.util.Optional;

public abstract class AbstractPlaidManager
{
    protected PlaidLinkService plaidLinkService;

    public AbstractPlaidManager(PlaidLinkService plaidLinkService)
    {
        this.plaidLinkService = plaidLinkService;
    }

    protected Optional<PlaidLinkEntity> getPlaidLinkByUserId(Long userId){
        return null;
    }

    protected String getPlaidAccessToken(PlaidLinkEntity plaidLinkEntity){
        return null;
    }
}
