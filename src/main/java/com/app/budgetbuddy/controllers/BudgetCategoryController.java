package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.exceptions.BudgetCategoryException;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.runner.BudgetCategoryRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(value="/api/budget-category")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class BudgetCategoryController
{
    private final BudgetCategoryRunner budgetCategoryRunner;
    private final SubBudgetService subBudgetService;

    @Autowired
    public BudgetCategoryController(BudgetCategoryRunner budgetCategoryRunner,
                                    SubBudgetService subBudgetService)
    {
        this.budgetCategoryRunner = budgetCategoryRunner;
        this.subBudgetService = subBudgetService;
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
