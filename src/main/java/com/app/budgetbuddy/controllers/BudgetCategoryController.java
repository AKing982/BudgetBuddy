package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.BudgetCategoryBody;
import com.app.budgetbuddy.domain.BudgetCategoryUpdate;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.exceptions.BudgetCategoryException;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.runner.BudgetCategoryRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(value="/api/budget-category")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class BudgetCategoryController
{
    private final BudgetCategoryRunner budgetCategoryRunner;
    private final BudgetCategoryService budgetCategoryService;
    private final SubBudgetService subBudgetService;

    @Autowired
    public BudgetCategoryController(BudgetCategoryRunner budgetCategoryRunner,
                                    BudgetCategoryService budgetCategoryService,
                                    SubBudgetService subBudgetService)
    {
        this.budgetCategoryRunner = budgetCategoryRunner;
        this.budgetCategoryService = budgetCategoryService;
        this.subBudgetService = subBudgetService;
    }

    @GetMapping("/{userId}/all")
    public ResponseEntity<List<BudgetCategory>> findAllUserBudgetCategories(@PathVariable Long userId)
    {
        try
        {
            List<BudgetCategory> userBudgetCategories = budgetCategoryService.getBudgetCategoriesByUserId(userId);
            return ResponseEntity.ok(userBudgetCategories);
        }catch(Exception e){
            log.error("There was an error retrieving all budget categories for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{userId}/update-all")
    public ResponseEntity<List<BudgetCategory>> updateBudgetCategories(@PathVariable Long userId,
                                                                       @RequestBody BudgetCategoryUpdate budgetCategoryUpdate)
    {
        try
        {
           Map<Long, String> budgetCategoriesMap = budgetCategoryUpdate.budgetCategoryUpdateMap();
           return ResponseEntity.ok(budgetCategoryService.updateBudgetCategories(budgetCategoriesMap));
        }catch(Exception e){
            log.error("There was an error updating budget categories for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/create")
    public ResponseEntity<List<BudgetCategory>> createBudgetCategories(@RequestParam Long userID,
                                                                       @RequestParam(required = false) LocalDate startDate,
                                                                       @RequestParam(required = false) LocalDate endDate)
    {
        // Find the SubBudget for this period
        Optional<SubBudget> subBudget = subBudgetService.findSubBudgetByUserIdAndDateRange(userID, startDate, endDate);
        if(subBudget.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }
        try
        {
            SubBudget subBudget1 = subBudget.get();
            List<BudgetCategory> createdBudgetCategories = budgetCategoryRunner.runBudgetCategoryProcessForMonth(subBudget1);
            return ResponseEntity.ok(createdBudgetCategories);
        }catch(BudgetCategoryException e){
            log.error("There was an error creating the budget categories for {} to {}: {}", startDate, endDate, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }


    @GetMapping("/create-date")
    public ResponseEntity<List<BudgetCategory>> createBudgetCategoriesForDate(@RequestParam Long userId,
                                                                              @RequestParam LocalDate date)
    {
        Optional<SubBudget> subBudgetForDate = subBudgetService.findSubBudgetByUserIdAndDate(userId, date);
        if(subBudgetForDate.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }
        try
        {
            SubBudget subBudget1 = subBudgetForDate.get();
            List<BudgetCategory> budgetCategoriesForDate = budgetCategoryRunner.runBudgetCategoryProcessForDate(date, subBudget1);
            return ResponseEntity.ok(budgetCategoriesForDate);
        }catch(BudgetCategoryException e){
            log.error("There was an error with creating the budget categories for date {}", date, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{userId}/update-amount")
    public ResponseEntity<BudgetCategory> updateBudgetAmount(@RequestBody BudgetCategoryBody budgetCategoryBody,
                                                             @PathVariable Long userId,
                                                             @RequestParam LocalDate startDate,
                                                             @RequestParam LocalDate endDate)
    {
        try
        {
            String category = budgetCategoryBody.category();
            double newBudgetedAmount = budgetCategoryBody.budgetAmount();
            budgetCategoryService.updateBudgetCategoryAmount(category, userId, startDate, endDate, BigDecimal.valueOf(newBudgetedAmount));
            return ResponseEntity.ok().build();
        }catch(DataException e){
            log.error("There was an error updating the budget amount for budget category: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update-by-month")
    public ResponseEntity<List<BudgetCategory>> updateBudgetCategoriesByMonth(@RequestParam Long userID,
                                                                              @RequestParam(required = true) LocalDate startDate,
                                                                              @RequestParam(required = true) LocalDate endDate)
    {
        try
        {
            Optional<SubBudget> subBudgetOptional =  subBudgetService.findSubBudgetByUserIdAndDateRange(userID, startDate, endDate);
            if(subBudgetOptional.isEmpty())
            {
                return ResponseEntity.notFound().build();
            }
            SubBudget subBudget = subBudgetOptional.get();
            List<BudgetCategory> updatedBudgetCategories = budgetCategoryRunner.runBudgetCategoryUpdateProcessForMonth(subBudget);
            return ResponseEntity.ok(updatedBudgetCategories);
        }catch(BudgetCategoryException e){
            log.error("There was an error updating the budget categories for start={} and end={}", startDate, endDate, e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
