package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.workbench.categories.TransactionRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/transaction-rules")
@CrossOrigin(origins="http://localhost:3000")
public class TransactionRuleController
{
    private final TransactionRuleService transactionRuleService;

    @Autowired
    public TransactionRuleController(TransactionRuleService transactionRuleService)
    {
        this.transactionRuleService = transactionRuleService;
    }

}
