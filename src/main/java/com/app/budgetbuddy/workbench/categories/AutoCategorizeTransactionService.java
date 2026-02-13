package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.services.TransactionRuleService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class AutoCategorizeTransactionService
{
    private final TransactionRuleService transactionRuleService;

    @Autowired
    public AutoCategorizeTransactionService(TransactionRuleService transactionRuleService)
    {
        this.transactionRuleService = transactionRuleService;
    }
}
