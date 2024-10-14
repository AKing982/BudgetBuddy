package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCategoryRequest;
import com.app.budgetbuddy.services.BudgetCategoriesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value="/api/budget-categories")
@CrossOrigin(value="http://localhost:3000")
public class BudgetCategoriesController
{
    private final BudgetCategoriesService budgetCategoriesService;

    @Autowired
    public BudgetCategoriesController(BudgetCategoriesService budgetCategoriesService){
        this.budgetCategoriesService = budgetCategoriesService;
    }

    @PostMapping("/")
    public ResponseEntity<?> createBudgetCategory(@RequestBody BudgetCategoryRequest budgetCategory){
        return null;
    }
}
