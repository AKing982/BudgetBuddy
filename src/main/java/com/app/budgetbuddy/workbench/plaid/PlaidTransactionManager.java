package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.services.PlaidLinkService;
import org.springframework.stereotype.Service;

@Service
public class PlaidTransactionManager extends AbstractPlaidManager
{

    public PlaidTransactionManager(PlaidLinkService plaidLinkService) {
        super(plaidLinkService);
    }
}
