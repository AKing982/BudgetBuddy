package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.PlaidImportResult;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.workbench.runner.CategoryRunner;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(value="/api/plaid-import")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class PlaidImportController
{
    private final PlaidTransactionRunner plaidTransactionRunner;
    private final CategoryRunner categoryRunner;

    @Autowired
    public PlaidImportController(PlaidTransactionRunner plaidTransactionRunner, CategoryRunner categoryRunner)
    {
        this.plaidTransactionRunner = plaidTransactionRunner;
        this.categoryRunner = categoryRunner;
    }

    @PostMapping("/{userId}/import")
    public ResponseEntity<PlaidImportResult> importPlaidTransactions(@PathVariable Long userId,
                                                                     @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                                     @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate)
    {
        log.info("Importing transactions for user {} between {} and {}", userId, startDate, endDate);
        try
        {
            List<Transaction> importedTransactions = plaidTransactionRunner.getTransactionsResponse(userId, startDate, endDate);
            plaidTransactionRunner.saveTransactions(importedTransactions);
            PlaidImportResult plaidImportResult = new PlaidImportResult(userId, importedTransactions, new ArrayList<>());
            categoryRunner.categorizeTransactionsByRange(userId, startDate, endDate);
            categoryRunner.categorizeRecurringTransactions(userId);
            return ResponseEntity.ok(plaidImportResult);
        }catch(Exception e){
            log.error("There was an error importing plaid transactions: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

}
