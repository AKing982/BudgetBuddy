package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.exceptions.TransactionRunnerException;
import com.app.budgetbuddy.workbench.runner.TransactionScheduleRunner;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/transactionRunner")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class TransactionRunnerController
{
    private TransactionScheduleRunner transactionScheduleRunner;

    @Autowired
    public TransactionRunnerController(TransactionScheduleRunner transactionScheduleRunner){
        this.transactionScheduleRunner = transactionScheduleRunner;
    }

    @GetMapping("/transactions/sync/dates/{userId}")
    public ResponseEntity<?> syncUserTransactionsByDate(@PathVariable Long userId,
                                                        @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                        @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate endDate){
        return null;
    }

    @GetMapping("/transactions/sync/{userId}")
    public ResponseEntity<?> syncUserTransactions(@PathVariable Long userId){
        if(userId < 1L){
            return ResponseEntity.badRequest().build();
        }
        try
        {
            transactionScheduleRunner.syncOnLogin(userId);
            log.info("Transaction Sync completed");
            return ResponseEntity.ok().build();
        }catch(TransactionRunnerException e){
            log.error("There was an error while syncing user transactions.", e);
            return ResponseEntity.internalServerError().build();
        }
    }

}
