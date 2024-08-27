package com.app.budgetbuddy.services;

import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Getter
public class PlaidService
{
    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;

    @Autowired
    public PlaidService(PlaidLinkTokenProcessor plaidLinkTokenProcessor){
        this.plaidLinkTokenProcessor = plaidLinkTokenProcessor;
    }
}
