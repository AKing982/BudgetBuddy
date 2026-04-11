package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BPTemplate;
import com.app.budgetbuddy.domain.BudgetPlannerRequest;
import com.app.budgetbuddy.workbench.budgetplanner.BPTemplateRunner;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@RestController
@RequestMapping(value="/api/budget-planner")
@CrossOrigin(value="http://localhost:3000")
public class BudgetPlannerController
{
    private final BPTemplateRunner bpTemplateRunner;

    @Autowired
    public BudgetPlannerController(BPTemplateRunner bpTemplateRunner)
    {
        this.bpTemplateRunner = bpTemplateRunner;
    }

    @PostMapping("/{userId}/create-template")
    public ResponseEntity<BPTemplate> createBudgetTemplate(@PathVariable Long userId,
                                                           @RequestBody BudgetPlannerRequest request)
    {
        return null;
    }

    @PutMapping("/{id}/update-template")
    public ResponseEntity<BPTemplate> updateBudgetTemplate(@PathVariable Long id,
                                                           @RequestBody BudgetPlannerRequest request)
    {
        return null;
    }

    @PutMapping("/update-category-amount")
    public ResponseEntity<BPTemplate> updateBudgetTemplateCategoryAmount(@RequestParam BigDecimal updatedAmount,
                                                                         @RequestParam LocalDate startDate,
                                                                         @RequestParam LocalDate endDate,
                                                                         @RequestParam Long userId,
                                                                         @RequestParam String category)
    {
        return null;
    }




}
