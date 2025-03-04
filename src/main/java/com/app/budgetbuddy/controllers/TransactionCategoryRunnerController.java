package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.workbench.runner.TransactionCategoryRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping(value="/api/transaction-category-runner")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class TransactionCategoryRunnerController
{
    private final TransactionCategoryRunner transactionCategoryRunner;

    @Autowired
    public TransactionCategoryRunnerController(TransactionCategoryRunner transactionCategoryRunner)
    {
        this.transactionCategoryRunner = transactionCategoryRunner;
    }

    @PostMapping("/process")
    public ResponseEntity<String> processTransactionCategories(@RequestParam Long userId, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate)
    {

        try
        {
            log.info("Starting transaction category processing for user {} between {} and {}",
                    userId, startDate, endDate);
            transactionCategoryRunner.processTransactionCategories(userId, startDate, endDate);
            return ResponseEntity.ok("Transaction categories processed successfully");
        } catch (RuntimeException e) {
            log.error("Error processing transaction categories: ", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Failed to process transaction categories: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error processing transaction categories: ", e);
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Unexpected error processing transaction categories");
        }
    }


}
