package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.workbench.TransactionImportService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value="/transaction-import")
@CrossOrigin(value="http://localhost:3000")
public class TransactionImportController
{
    private final TransactionImportService transactionImportService;

    @Autowired
    public TransactionImportController(TransactionImportService transactionImportService)
    {
        this.transactionImportService = transactionImportService;
    }


}
