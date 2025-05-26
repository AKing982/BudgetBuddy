package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.runner.BudgetCategoryRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(value="/api/budget-category-test")
@CrossOrigin(value="http://localhost:3000")
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
                                                                       @RequestParam(required = false)LocalDate startDate,
                                                                       @RequestParam(required = false)LocalDate endDate)
    {
        // Find the SubBudget for this period
        Optional<SubBudget> subBudget = subBudgetService.findSubBudgetByUserIdAndDateRange(userID, startDate, endDate);
        if(subBudget.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }
        SubBudget subBudget1 = subBudget.get();
        List<BudgetCategory> createdBudgetCategories = budgetCategoryRunner.runBudgetCategoryProcessForMonth(subBudget1);
        return ResponseEntity.ok(createdBudgetCategories);
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
        SubBudget subBudget1 = subBudgetForDate.get();
        List<BudgetCategory> budgetCategoriesForDate = budgetCategoryRunner.runBudgetCategoryProcessForDate(date, subBudget1);
        return ResponseEntity.ok(budgetCategoriesForDate);
    }
}
