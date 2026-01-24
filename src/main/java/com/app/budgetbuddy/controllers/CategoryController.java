package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.CategorySaveData;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.CategoryRunnerException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.runner.CategoryRunner;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/category")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class CategoryController
{
    private final CategoryRunner categoryRunner;
    private final CategoryService categoryService;

    @Autowired
    public CategoryController(CategoryRunner categoryRunner,
                              CategoryService categoryService)
    {
        this.categoryRunner = categoryRunner;
        this.categoryService = categoryService;
    }

    @GetMapping("/all-sys-categories")
    public ResponseEntity<List<CategoryEntity>> getAllSystemCategories()
    {
        try
        {
            List<CategoryEntity> systemCategories = categoryService.findAllSystemCategories();
            return ResponseEntity.ok(systemCategories);
        }catch(Exception e){
            log.error("There was an error retrieving all system categories: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/categorize/transaction")
    public ResponseEntity<TransactionCSV> categorizeCSVTransaction(@RequestBody @NotNull CategorySaveData categorySaveData)
    {
        try
        {
            categoryRunner.categorizeSingleCSVTransaction(categorySaveData);
            log.info("Successfully categorized csv transaction with category save data: {}", categorySaveData);

            // TODO: Add code to fetch the categorized transaction CSV list

            return ResponseEntity.ok().build();
        }catch(CategoryRunnerException e){
            log.error("There was an error categorizing the CSV transaction: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/categorize/{userId}/csv")
    public ResponseEntity<List<TransactionCSV>> categorizeCSVTransactionsByUserId(@PathVariable Long userId,
                                                                                  @RequestParam LocalDate startDate,
                                                                                  @RequestParam LocalDate endDate)
    {
        try
        {
            categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);
            log.info("Successfully categorized CSV transactions for user {} between {} and {}", userId, startDate, endDate);
            //TODO: Add code to fetch the transaction csv list
            return ResponseEntity.ok().build();
        }catch(CategoryRunnerException e){
            log.error("There was an error running the category runner for user {} between {} and {}: ", userId, startDate, endDate, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
