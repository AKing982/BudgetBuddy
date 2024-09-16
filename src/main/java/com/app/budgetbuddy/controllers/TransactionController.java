package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.TransactionDTO;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.services.TransactionService;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping(value="/api/transaction")
@CrossOrigin(value="http://localhost:3000")
public class TransactionController {

    private final TransactionService transactionService;

    @Autowired
    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllTransactions() {
        List<TransactionsEntity> transactions = (List<TransactionsEntity>) transactionService.findAll();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/by-amount-range")
    public ResponseEntity<?> getTransactionsByAmountRange(@RequestParam @NotNull BigDecimal startAmount, @RequestParam @NotNull BigDecimal endAmount) {
        return ResponseEntity.badRequest().build();
    }

    @GetMapping("/{userId}/pending")
    public ResponseEntity<?> getPendingTransactionsForUser(@PathVariable Long userId) {
        return null;
    }

    @GetMapping("/by-amount")
    public ResponseEntity<?> getTransactionsByAmount(@RequestParam BigDecimal startAmount) {
        return null;
    }

    @GetMapping("/by-date")
    public ResponseEntity<?> getTransactionsByDate(@RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date) {
        return null;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getTransactionsForUser(@PathVariable Long userId) {
        return null;
    }

    @PostMapping("/save-transactions")
    public ResponseEntity<?> saveTransactions(@RequestBody List<TransactionDTO> transactions) {
        return null;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTransaction(@PathVariable Long id, @RequestBody TransactionDTO transaction) {
        return null;
    }


}
