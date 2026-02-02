package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.services.GroceryBudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(value="/api/grocery-budget")
@CrossOrigin(value="http://localhost:3000")
public class GroceryBudgetController
{
    private final GroceryBudgetService groceryBudgetService;

    @Autowired
    public GroceryBudgetController(GroceryBudgetService groceryBudgetService)
    {
        this.groceryBudgetService = groceryBudgetService;
    }
}
