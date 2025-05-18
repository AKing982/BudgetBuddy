package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.exceptions.PlaidImportException;
import com.app.budgetbuddy.services.PlaidTransactionImportService;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(value="/api/plaid-import")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class PlaidImportController
{
    private final PlaidTransactionImportService plaidTransactionImportService;

    @Autowired
    public PlaidImportController(PlaidTransactionImportService plaidTransactionImportService)
    {
        this.plaidTransactionImportService = plaidTransactionImportService;
    }

    @PostMapping("/{userId}/import")
    public ResponseEntity<List<BudgetCategory>> importPlaidTransactions(@PathVariable Long userId,
                                                                        @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                                        @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate){
        try
        {
            List<BudgetCategory> result = plaidTransactionImportService.runTransactionImportForPeriod(userId, startDate, endDate);
            if(result.isEmpty())
            {
                log.debug("No Budget Categories were created for startdate {} and enddate {}", startDate, endDate);
                return ResponseEntity.ok(result);
            }
            return ResponseEntity.ok(result);

        }catch(PlaidImportException | IOException e)
        {
            log.error("There was an error importing the plaid transactions: ", e);
            return ResponseEntity.internalServerError().build();
        }

    }

}
