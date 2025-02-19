package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.workbench.budget.BudgetSetupEngine;
import com.app.budgetbuddy.workbench.runner.BudgetSetupRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

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



}
