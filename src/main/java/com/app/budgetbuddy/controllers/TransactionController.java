package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.TransactionDTO;
import com.app.budgetbuddy.domain.TransactionResponse;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.TransactionsNotFoundException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.TransactionService;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(value="/api/transaction")
@CrossOrigin(value="http://localhost:3000")
public class TransactionController {

    private final TransactionService transactionService;
    private final CategoryService categoryService;
    private final Logger LOGGER = LoggerFactory.getLogger(TransactionController.class);

    @Autowired
    public TransactionController(TransactionService transactionService,
                                 CategoryService categoryService) {
        this.transactionService = transactionService;
        this.categoryService = categoryService;
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllTransactions() {
        List<TransactionsEntity> transactions = (List<TransactionsEntity>) transactionService.findAll();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/by-amount-range")
    public ResponseEntity<?> getTransactionsByAmountRange(@RequestParam @NotNull BigDecimal startAmount, @RequestParam @NotNull BigDecimal endAmount) {
        List<TransactionsEntity> transactionsEntities = (List<TransactionsEntity>) transactionService.getTransactionsByAmountBetween(startAmount, endAmount);
        return ResponseEntity.ok(transactionsEntities);
    }

    @GetMapping("/{userId}/pending")
    public ResponseEntity<?> getPendingTransactionsForUser(@PathVariable @NotNull Long userId) {
        if(userId < 1L){
            return ResponseEntity.badRequest().body("User id must be greater than 1");
        }
        List<TransactionsEntity> pendingTransactions = (List<TransactionsEntity>) transactionService.getTransactionsByPendingTrue();
        return ResponseEntity.ok(pendingTransactions);
    }

    @GetMapping("/by-amount")
    public ResponseEntity<?> getTransactionsByAmount(@RequestParam @NotNull BigDecimal startAmount) {
        List<TransactionsEntity> transactionsEntities = (List<TransactionsEntity>) transactionService.getTransactionsByAmount(startAmount);
        return ResponseEntity.ok(transactionsEntities);
    }

    @GetMapping("/by-date")
    public ResponseEntity<?> getTransactionsByDate(@RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate date) {
        List<TransactionsEntity> transactionsEntityList = (List<TransactionsEntity>) transactionService.getTransactionsByAuthorizedDate(date);
        return ResponseEntity.ok(transactionsEntityList);
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getTransactionsForUser(@PathVariable Long userId) {
        return null;
    }

    @GetMapping("/{userId}/by-date")
    public ResponseEntity<?> getTransactionsForUserByDateRange(@PathVariable @NotNull Long userId,
                                                               @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                               @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<TransactionsEntity> transactionsEntities = transactionService.getTransactionsForUserAndDateRange(userId, startDate, endDate);
        List<TransactionResponse> transactionResponses = createTransactionResponse(transactionsEntities);
        LOGGER.info("Sending Transaction Response to client: {}", transactionResponses);
        return ResponseEntity.ok(transactionResponses);
    }

    private List<TransactionResponse> createTransactionResponse(final List<TransactionsEntity> transactionsEntities) {
        List<TransactionResponse> transactionResponses = new ArrayList<>();
        for(TransactionsEntity transaction: transactionsEntities){
            TransactionResponse transactionResponse = new TransactionResponse();
            transactionResponse.setAmount(transaction.getAmount());
            transactionResponse.setTransactionId(transaction.getId());
            transactionResponse.setName(transaction.getMerchantName());
            transactionResponse.setPending(transaction.isPending());
            transactionResponse.setAccountId(transaction.getAccount().getId());
            transactionResponse.setLogoURL(transaction.getLogoUrl());
            transactionResponse.setAuthorizedDate(transaction.getAuthorizedDate());
            // Safely set the category ID
            transactionResponse.setCategoryId(fetchCategory(transaction.getCategory().getId()));
            transactionResponse.setMerchantName(transaction.getMerchantName());
            transactionResponses.add(transactionResponse);
        }
        return transactionResponses;
    }

    private String fetchCategory(final String categoryId){
        Optional<CategoryEntity> categoryEntity = categoryService.findCategoryById(categoryId);
        if(categoryEntity.isPresent()){
            return categoryEntity.get().getId();
        }
        return categoryId;
    }

    private List<String> getCategoriesForTransaction(String transactionId, String categoryId){
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
