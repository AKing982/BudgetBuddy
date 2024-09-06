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
    public SpendingController(SpendingCalculatorService spendingCalculatorService) {
        this.spendingCalculatorService = spendingCalculatorService;
    }

    @GetMapping("/total/{userId}")
    public ResponseEntity<?> getSpendingTotal(@PathVariable Long userId){
        return null;
    }

    @PostMapping("/calculate")
    public ResponseEntity<?> calculateSpending(@RequestBody SpendingRequest spendingRequest){
        return null;
    }

    @GetMapping("/average/{userId}")
    public ResponseEntity<?> getSpendingAverage(@PathVariable Long userId,
                                                @RequestParam LocalDate startDate,
                                                @RequestParam LocalDate endDate){
        return null;
    }

    @GetMapping("/breakdown")
    public ResponseEntity<?> getSpendingBreakdown(@RequestParam PeriodRequest periodRequest){
        return null;
    }

    @GetMapping("/top-categories")
    public ResponseEntity<?> getSpendingTopCategories(@RequestParam Integer limit){
        return null;
    }
}
