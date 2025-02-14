package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetPeriodCategory;
import com.app.budgetbuddy.domain.BudgetPeriodCategoryResponse;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.workbench.budget.BudgetPeriodCategoryService;
import com.app.budgetbuddy.workbench.budget.BudgetPeriodQueries;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/budgetPeriod")
@CrossOrigin("origins=http://localhost:3000")
@Slf4j
public class BudgetPeriodController
{
    private BudgetPeriodQueries budgetPeriodQueries;

    @Autowired
    public BudgetPeriodController(BudgetPeriodQueries budgetPeriodQueries)
    {
        this.budgetPeriodQueries = budgetPeriodQueries;
    }

    @GetMapping("/daily")
    public ResponseEntity<?> getDailyBudgetPeriodCategories(@RequestParam Long userId,
                                                            @RequestParam LocalDate date)
    {
        if(userId <= 0)
        {
            return ResponseEntity.badRequest().body("Invalid user id");
        }
        try
        {
           List<BudgetPeriodCategory> dailyBudgetPeriodCategories = budgetPeriodQueries.getBudgetPeriodQueryForDate(date, userId);
           BudgetPeriodCategoryResponse budgetPeriodCategoryResponse = new BudgetPeriodCategoryResponse(dailyBudgetPeriodCategories);
           return ResponseEntity.ok(budgetPeriodCategoryResponse);
        }catch(Exception e)
        {
            log.error("There was an error retrieving the budget period categories for date {}: ", date, e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/period")
    public ResponseEntity<?> getBudgetPeriodCategoriesByPeriod(@RequestParam Long userId,
                                                               @RequestParam Period period,
                                                               @RequestParam LocalDate startDate,
                                                               @RequestParam LocalDate endDate) {
        if(userId <= 0 || period == null || startDate == null || endDate == null)
        {
            return ResponseEntity.badRequest().body("Invalid user id");
        }
        try
        {
            List<BudgetPeriodCategory> budgetPeriodCategories = budgetPeriodQueries.getBudgetPeriodQueryData(userId, startDate, endDate, period);
            return ResponseEntity.ok(new BudgetPeriodCategoryResponse(budgetPeriodCategories));
        }catch(Exception e)
        {
            log.error("There was an error retrieving the budget period categories for period {} and startDate {} and endDate {}: ", period, startDate, endDate, e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

}
