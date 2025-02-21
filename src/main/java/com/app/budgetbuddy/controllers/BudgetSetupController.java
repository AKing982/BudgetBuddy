package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetRegistration;
import com.app.budgetbuddy.workbench.runner.BudgetSetupRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgetSetup")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class BudgetSetupController
{
    private BudgetSetupRunner budgetSetupRunner;

    @Autowired
    public BudgetSetupController(BudgetSetupRunner budgetSetupRunner)
    {
        this.budgetSetupRunner = budgetSetupRunner;
    }

    @PostMapping("/setup")
    public ResponseEntity<?> runBudgetSetupProcess(@RequestBody BudgetRegistration budgetRegistration)
    {
        if(budgetRegistration == null)
        {
            return ResponseEntity.badRequest().body("budgetRegistration is null");
        }
        Long userId = budgetRegistration.getUserId();
        try
        {
            log.info("Running Budget Setup Process for user {} ", userId);
            budgetSetupRunner.runBudgetSetup(budgetRegistration);
            return ResponseEntity.ok().build();
        }catch(Exception e)
        {
            log.error("Failed to run the budget setup process for user {}: {}", userId, e.getMessage());
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }



}
