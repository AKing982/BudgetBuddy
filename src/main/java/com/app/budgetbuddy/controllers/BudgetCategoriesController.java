package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.BudgetCategoryRequest;
import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import com.app.budgetbuddy.services.BudgetCategoriesService;
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
    private final BudgetCategoriesService budgetCategoriesService;
    private final Logger LOGGER = LoggerFactory.getLogger(BudgetCategoriesController.class);

    @Autowired
    public BudgetCategoriesController(BudgetCategoriesService budgetCategoriesService){
        this.budgetCategoriesService = budgetCategoriesService;
    }

    @PostMapping("/")
    public ResponseEntity<?> createBudgetCategory(@RequestBody BudgetCategoryRequest budgetCategory){
        List<BudgetCategory> budgetCategories = budgetCategory.categories();
        try
        {
            List<BudgetCategoriesEntity> budgetCategoriesEntities = createBudgetCategoryEntities(budgetCategories);
            return ResponseEntity.ok(budgetCategoriesEntities);

        }catch(Exception e){
            LOGGER.error(e.getMessage());
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }

    private List<BudgetCategoriesEntity> createBudgetCategoryEntities(List<BudgetCategory> budgetCategories){
        List<BudgetCategoriesEntity> budgetCategoriesEntities = new ArrayList<>();
        for(BudgetCategory budgetCategory : budgetCategories){
            BudgetCategoriesEntity budgetCategoriesEntity = budgetCategoriesService.createAndSaveBudgetCategory(budgetCategory);
            budgetCategoriesEntities.add(budgetCategoriesEntity);
        }
        return budgetCategoriesEntities;
    }
}
