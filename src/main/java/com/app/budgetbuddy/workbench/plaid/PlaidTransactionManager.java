package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.request.PlaidApi;
import org.springframework.stereotype.Service;

@Service
public class PlaidTransactionManager extends AbstractPlaidManager
{

    public PlaidTransactionManager(PlaidLinkService plaidLinkService, PlaidApi plaidApi) {
        super(plaidLinkService, plaidApi);
    }
}
