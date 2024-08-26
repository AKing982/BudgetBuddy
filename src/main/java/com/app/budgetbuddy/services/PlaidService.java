package com.app.budgetbuddy.services;

import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class PlaidService
{
    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;

    @Autowired
    public PlaidService(PlaidLinkTokenProcessor plaidLinkTokenProcessor){
        this.plaidLinkTokenProcessor = plaidLinkTokenProcessor;
    }
}
