package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.workbench.runner.BudgetEnvelopeRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/api/budget-envelope")
@CrossOrigin(origins="http://localhost:3000")
public class BudgetEnvelopeController
{
    private final BudgetEnvelopeRunner budgetEnvelopeRunner;

    @Autowired
    public BudgetEnvelopeController(BudgetEnvelopeRunner budgetEnvelopeRunner)
    {
        this.budgetEnvelopeRunner = budgetEnvelopeRunner;
    }
}
