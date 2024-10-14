package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetGoalsRequest;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
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

    @Autowired
    public BudgetGoalsController(BudgetGoalsService budgetGoalsService){
        this.budgetGoalsService = budgetGoalsService;
    }

    @PostMapping("/")
    public ResponseEntity<BudgetGoalsEntity> createBudgetGoal(@RequestBody BudgetGoalsRequest budgetGoalsRequest){
        return null;
    }

    @GetMapping("/{id}")
    public ResponseEntity<BudgetGoalsEntity> getBudgetGoalById(@PathVariable("id") Long id){
        return null;
    }

    @GetMapping("/")
    public List<BudgetGoalsEntity> getAllBudgetGoals(){
        return null;
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetGoalsEntity> updateBudgetGoal(@PathVariable("id") Long id, @RequestBody BudgetGoalsRequest budgetGoals){
        return null;
    }
}
