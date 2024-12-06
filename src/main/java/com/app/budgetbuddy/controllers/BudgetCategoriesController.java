package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCategoryRequest;
import com.app.budgetbuddy.domain.ControlledBudgetCategory;
import com.app.budgetbuddy.entities.ControlledSpendingCategoryEntity;
import com.app.budgetbuddy.services.ControlledSpendingCategoriesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(value="/api/budget-categories")
@CrossOrigin(value="http://localhost:3000")
public class BudgetCategoriesController
{
    private final ControlledSpendingCategoriesService budgetCategoriesService;
    private final Logger LOGGER = LoggerFactory.getLogger(BudgetCategoriesController.class);

    @Autowired
    public BudgetCategoriesController(ControlledSpendingCategoriesService budgetCategoriesService){
        this.budgetCategoriesService = budgetCategoriesService;
    }

    @PostMapping("/")
    public ResponseEntity<?> createBudgetCategory(@RequestBody BudgetCategoryRequest budgetCategory){
        List<ControlledBudgetCategory> budgetCategories = budgetCategory.categories();
        try
        {
            List<ControlledSpendingCategoryEntity> budgetCategoriesEntities = createBudgetCategoryEntities(budgetCategories);
            return ResponseEntity.ok(budgetCategoriesEntities);

        }catch(Exception e){
            LOGGER.error(e.getMessage());
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    private List<ControlledSpendingCategoryEntity> createBudgetCategoryEntities(List<ControlledBudgetCategory> budgetCategories){
        List<ControlledSpendingCategoryEntity> budgetCategoriesEntities = new ArrayList<>();
        for(ControlledBudgetCategory budgetCategory : budgetCategories){
            ControlledSpendingCategoryEntity budgetCategoriesEntity = budgetCategoriesService.createAndSaveBudgetCategory(budgetCategory);
            budgetCategoriesEntities.add(budgetCategoriesEntity);
        }
        return budgetCategoriesEntities;
    }
}
