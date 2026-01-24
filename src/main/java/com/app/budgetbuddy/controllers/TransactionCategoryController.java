package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.TransactionCSV;
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
