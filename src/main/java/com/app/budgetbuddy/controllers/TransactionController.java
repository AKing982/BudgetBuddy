package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.TransactionsNotFoundException;
import com.app.budgetbuddy.services.CSVTransactionService;
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
public class TransactionController
{
    private final TransactionService transactionService;
    private final CSVTransactionService csvTransactionService;
    private final CategoryService categoryService;
    private final Logger LOGGER = LoggerFactory.getLogger(TransactionController.class);

    @Autowired
    public TransactionController(TransactionService transactionService,
                                 CSVTransactionService csvTransactionService,
                                 CategoryService categoryService)
    {
        this.transactionService = transactionService;
        this.csvTransactionService = csvTransactionService;
        this.categoryService = categoryService;
    }

    @GetMapping("/")
    public ResponseEntity<?> getAllTransactions() {
        List<TransactionsEntity> transactions = (List<TransactionsEntity>) transactionService.findAll();
        return ResponseEntity.ok(transactions);
    }

    @GetMapping("/{userId}/csv")
    public ResponseEntity<List<TransactionCSV>> getCsvTransactionsForUser(@PathVariable Long userId,
                                                       @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                       @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate endDate)
    {
        if(userId < 1L)
        {
            return ResponseEntity.badRequest().build();
        }
        int pageLimit = 30;
        List<TransactionCSV> transactionCSVsForUser = csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, pageLimit);
        return ResponseEntity.ok(transactionCSVsForUser);
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

//    @PutMapping("/update/category")
//    public ResponseEntity<TransactionCSV> updateTransactionCSVByCategory(@RequestParam Long transactionId,
//                                                                         @RequestParam String category)
//    {
//        try
//        {
//            Optional<TransactionCSV> updatedTransactionCSVOptional = csvTransactionService.updateTransactionCSVByCategory(transactionId, category);
//            if(updatedTransactionCSVOptional.isEmpty())
//            {
//                return ResponseEntity.notFound().build();
//            }
//            LOGGER.info("Updated Transaction CSV with id: {} and category: {}", transactionId, category);
//            TransactionCSV updatedTransactionCSV = updatedTransactionCSVOptional.get();
//            return ResponseEntity.ok(updatedTransactionCSV);
//        }catch(Exception e){
//            LOGGER.error("There was an error updating the transaction CSV", e);
//            return ResponseEntity.internalServerError().body(null);
//        }
//    }

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
            transactionResponse.setPosted(transaction.getPosted());
            // Safely handle potential null category
            if (transaction.getCategory() != null) {
                transactionResponse.setCategories(getCategoriesForTransaction(transaction.getId(), transaction.getCategory().getPlaidCategoryId()));
                transactionResponse.setCategoryId(fetchCategory(transaction.getCategory().getPlaidCategoryId()));
            } else {
                LOGGER.warn("Transaction with ID {} has no category", transaction.getId());
                transactionResponse.setCategories(Collections.emptyList());
                transactionResponse.setCategoryId(null);
            }

//            // Safely set the category ID
//            transactionResponse.setCategoryId(fetchCategory(transaction.getCategory().getId()));
            transactionResponse.setMerchantName(transaction.getMerchantName());
            transactionResponses.add(transactionResponse);
        }
        return transactionResponses;
    }

    private String fetchCategory(final String categoryId){
//        if(categoryId == null){
//            LOGGER.warn("Category with ID {} has no category", categoryId);
//            return null;
//        }
//        Optional<CategoryEntity> categoryEntity = categoryService.findCategoryById(categoryId);
//        if(categoryEntity.isPresent()){
//            return categoryEntity.get().getPlaidCategoryId();
//        }
//        LOGGER.info("Returning CategoryId: {}", categoryId);
//        return categoryId;
        return "";
    }

    private List<String> getCategoriesForTransaction(String transactionId, String categoryId){
        if(categoryId == null){
            LOGGER.info("Category with ID {} has no category", transactionId);
            return Collections.emptyList();
        }
        Optional<TransactionsEntity> transaction = transactionService.getTransactionByIdAndCategoryId(transactionId, categoryId);
        List<String> categories = new ArrayList<>();
        if(transaction.isPresent()){
            CategoryEntity category = transaction.get().getCategory();
            categories.add(category.getCategory());
            categories.add(category.getDescription());
        }else{
            LOGGER.warn("Transaction with ID {} has no category", transactionId);
        }
        return categories;
    }

    @PostMapping("/save-transactions")
    public ResponseEntity<?> saveTransactions(@RequestBody TransactionBaseRequest transactionBaseRequest) {
        try
        {
            List<Transaction> transactions = transactionBaseRequest.getTransactions();
            List<TransactionsEntity> transactionsEntities = transactionService.createAndSaveTransactions(transactions);
            return ResponseEntity.ok(transactionsEntities);
        }catch(Exception e){
            LOGGER.error("There was an error saving the transactions", e);
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PostMapping("/transaction-runner")
    public ResponseEntity<?> runTransactionRunner(@RequestBody TransactionBaseRequest transactionBaseRequest) {
        return null;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateTransaction(@PathVariable Long id, @RequestBody TransactionDTO transaction) {
        return null;
    }


}
