package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.services.BudgetCategoriesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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
}
