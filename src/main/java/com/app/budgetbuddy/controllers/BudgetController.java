package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCreateRequest;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.services.BudgetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping(value="/api/budgets")
@CrossOrigin(value="http://localhost:3000")
public class BudgetController
{
    private final BudgetService budgetService;
    private final Logger LOGGER = LoggerFactory.getLogger(BudgetController.class);

    @Autowired
    public BudgetController(BudgetService budgetService){
        this.budgetService = budgetService;
    }

    @PostMapping("/")
    public ResponseEntity<?> createBudget(@RequestBody BudgetCreateRequest budget){
        if((budget.budgetDescription() == null || budget.budgetDescription().isEmpty()) ||
                budget.budgetAmount() == null || budget.budgetAmount().compareTo(BigDecimal.ONE) < 1
                || budget.endDate() == null || budget.startDate() == null || budget.monthlyIncome() == null
                || (budget.budgetName() == null || budget.budgetName().isEmpty()) || budget.userId() == null){
            return ResponseEntity.badRequest().body("Invalid budget request");
        }
        try
        {
            BudgetEntity budgetEntity = budgetService.createAndSaveBudget(budget);
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(budgetEntity);
        }catch(Exception e){
            LOGGER.error("There was an error while creating the budget", e);
            return ResponseEntity.internalServerError().body("There was an error while creating the budget");
        }
    }



    @GetMapping("/{id}")
    public ResponseEntity<BudgetEntity> getBudgetById(@PathVariable Long id){
        return null;
    }

    @PutMapping("/{id}")
    public ResponseEntity<BudgetEntity> updateBudget(@PathVariable Long id, @RequestBody BudgetEntity budget){
        return null;
    }

}
