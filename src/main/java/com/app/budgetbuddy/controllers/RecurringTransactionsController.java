package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.RecurringTransactionRequest;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.services.RecurringTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(value="/api/recurring-transactions")
@CrossOrigin(value="http://localhost:3000")
public class RecurringTransactionsController
{
    private final RecurringTransactionService recurringTransactionService;

    @Autowired
    public RecurringTransactionsController(RecurringTransactionService recurringTransactionService){
        this.recurringTransactionService = recurringTransactionService;
    }

    @GetMapping("/")
    public ResponseEntity<List<RecurringTransactionEntity>> getAllRecurringTransactions(){
        return null;
    }

    @GetMapping("/users/{userId}/recurring")
    public ResponseEntity<List<RecurringTransactionEntity>> getAllRecurringTransactionsByUserId(@PathVariable Long userId){
        return null;
    }

    @GetMapping("/{userId}/by-date-range")
    public ResponseEntity<List<RecurringTransactionEntity>> getRecurringTransactionsByDateRange(@PathVariable Long userId,
                                                                                           @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                                                           @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate endDate){
        return null;
    }

    @PostMapping("/")
    public ResponseEntity<?> createRecurringTransaction(@RequestBody RecurringTransactionRequest recurringTransactionEntity){
        return null;
    }


}
