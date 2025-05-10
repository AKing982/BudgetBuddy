package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetGoalsRequest;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping(value="/api/budget-goals")
@CrossOrigin(value="http://localhost:3000")
public class BudgetGoalsController
{
    private final BudgetGoalsService budgetGoalsService;
    private final Logger LOGGER = LoggerFactory.getLogger(BudgetGoalsController.class);

    @Autowired
    public BudgetGoalsController(BudgetGoalsService budgetGoalsService){
        this.budgetGoalsService = budgetGoalsService;
    }

    @PostMapping("/")
    public ResponseEntity<BudgetGoalsEntity> createBudgetGoal(@RequestBody BudgetGoalsRequest budgetGoalsRequest){
        if(budgetGoalsRequest == null){
            return ResponseEntity.badRequest().body(null);
        }
        try
        {
            BudgetGoalsEntity budgetGoals = budgetGoalsService.createAndSaveBudgetGoal(budgetGoalsRequest);
            LOGGER.info("Budget Goals: {}", budgetGoals);
            return ResponseEntity.ok(budgetGoals);

        }catch(Exception e){
            LOGGER.error(e.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }
}
