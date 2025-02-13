package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.workbench.budget.BudgetPeriodCategoryService;
import com.app.budgetbuddy.workbench.budget.BudgetPeriodQueries;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

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
            return budgetPeriodCategoryService.getBudgetPeriodCategories()
        }catch(Exception e)
        {

        }
        return null;
    }

    @GetMapping("/bi-weekly")
    public ResponseEntity<?> getBiWeeklyBudgetPeriodCategories(@RequestParam Long userId,
                                                               @RequestParam LocalDate monthStart,
                                                               @RequestParam LocalDate monthEnd)
    {
        return null;
    }

    @GetMapping("/weekly")
    public ResponseEntity<?> getWeeklyBudgetPeriodCategories(@RequestParam Long userId,
                                                             @RequestParam LocalDate monthStart,
                                                             @RequestParam LocalDate monthEnd)
    {
        return null;
    }

    @GetMapping("/monthly")
    public ResponseEntity<?> getMonthlyBudgetPeriodCategories(@RequestParam Long userID,
                                                              @RequestParam LocalDate monthStart,
                                                              @RequestParam LocalDate monthEnd)
    {
        return null;
    }

}
