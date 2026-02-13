package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BoolStatus;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.TransactionCategoryQueries;
import com.app.budgetbuddy.services.TransactionCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/transaction-category")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class TransactionCategoryController
{
    private final TransactionCategoryService transactionCategoryService;
    private final TransactionCategoryQueries transactionCategoryQueries;

    @Autowired
    public TransactionCategoryController(TransactionCategoryService transactionCategoryService,
                                         TransactionCategoryQueries transactionCategoryQueries)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.transactionCategoryQueries = transactionCategoryQueries;
    }

    @GetMapping("/is-updated-by-month")
    public ResponseEntity<BoolStatus> checkIfAnyUpdatedTransactionCategoriesByMonth(@RequestParam Long userId,
                                                                                    @RequestParam LocalDate startDate,
                                                                                    @RequestParam LocalDate endDate)
    {
        try
        {
            boolean anyUpdated = transactionCategoryService.checkUpdatedTransactionCategoriesByDateRange(userId, startDate, endDate);
            if(anyUpdated)
            {
                BoolStatus updatedStatus = new BoolStatus(true, "Found Updated Transaction Categories");
                return ResponseEntity.ok(updatedStatus);
            }
            return ResponseEntity.ok(new BoolStatus(false, "No Updated Transaction Categories"));
        }catch(DataException e){
            log.error("There was an error checking for any updated transaction categories: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/is-new-by-month")
    public ResponseEntity<BoolStatus> checkIfAnyNewTransactionCategoriesByMonth(@RequestParam Long userId,
                                                                                @RequestParam LocalDate startDate,
                                                                                @RequestParam LocalDate endDate)
    {
        try
        {
            boolean anyNew =  transactionCategoryService.checkNewTransactionCategoriesByDateRange(userId, startDate, endDate);
            if(anyNew)
            {
                BoolStatus newStatus = new BoolStatus(true, "Found New Transaction Categories");
                return ResponseEntity.ok(newStatus);
            }
            return ResponseEntity.ok(new BoolStatus(false, "No New Transaction Categories"));
        }catch(DataException e){
            log.error("There was an error checking for any new transaction categories: {}", e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update/category")
    public ResponseEntity<TransactionCSV> updateCSVTransactionCategory(@RequestParam Long csvTransactionId,
                                                                       @RequestParam String category,
                                                                       @RequestParam Long userId)
    {
        try
        {
            log.info("Updating TransactionCategory with csv Id {} with updated category {}", csvTransactionId, category);
            transactionCategoryService.updateTransactionCategoriesByIdAndCategory(category, csvTransactionId);
            log.info("Updated TransactionCategory with csv Id {}", csvTransactionId);
            Optional<TransactionCSV> transactionCSVOptional = transactionCategoryQueries.getSingleTransactionCSVWithCategory(csvTransactionId, userId);
            return transactionCSVOptional.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
        }catch(Exception ex){
            log.error("Exception in updateCSVTransactionCategory", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/transactions")
    public ResponseEntity<List<Transaction>> getTransactionsByCategoryList(@PathVariable Long userId,
                                                                           @RequestParam LocalDate startDate,
                                                                           @RequestParam LocalDate endDate)
    {
        try
        {
            List<Transaction> transactionsList = transactionCategoryQueries.getTransactionsByCategoryList(userId, startDate, endDate);
            return ResponseEntity.ok(transactionsList);
        }catch(Exception ex){
            log.error("There was an error fetching the transactions by category list", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/csv")
    public ResponseEntity<List<TransactionCSV>> getTransactionCSVWithCategoryList(@PathVariable Long userId,
                                                                                  @RequestParam LocalDate startDate,
                                                                                  @RequestParam LocalDate endDate)
    {
        try
        {
            List<TransactionCSV> transactionCSVList = transactionCategoryQueries.getTransactionCSVByCategoryList(startDate, endDate, userId);
            return ResponseEntity.ok(transactionCSVList);
        }catch(Exception ex){
            log.error("There was an error fetching the TransactionCSV with category list", ex);
            return ResponseEntity.internalServerError().build();
        }
    }
}
