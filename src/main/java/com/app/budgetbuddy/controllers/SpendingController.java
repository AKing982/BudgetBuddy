package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetPeriod;
import com.app.budgetbuddy.domain.PeriodRequest;
import com.app.budgetbuddy.domain.SpendingRequest;
import com.app.budgetbuddy.services.SpendingCalculatorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping(value="/api/spending")
@CrossOrigin(value="http://localhost:3000")
public class SpendingController {

    private final SpendingCalculatorService spendingCalculatorService;

    @Autowired
    public SpendingController(SpendingCalculatorService spendingCalculatorService)
    {
        this.spendingCalculatorService = spendingCalculatorService;
    }

}
