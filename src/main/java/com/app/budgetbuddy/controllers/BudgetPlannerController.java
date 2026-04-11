package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.workbench.budgetplanner.BPTemplateRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(value="/api/budget-planner")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class BudgetPlannerController
{
    private final BPTemplateRunner bpTemplateRunner;

    @Autowired
    public BudgetPlannerController(BPTemplateRunner bpTemplateRunner)
    {
        this.bpTemplateRunner = bpTemplateRunner;
    }

    @PostMapping("/create-template")
    public ResponseEntity<BPTemplate> createBudgetTemplate(@RequestBody BudgetPlannerRequest request)
    {
        if(request == null)
        {
            return ResponseEntity.badRequest().body(null);
        }
        Long userId = request.userId();
        List<DateRange> dateRanges = request.dateRanges();
        BPTemplateType templateType = request.templateType();
        Period period = request.period();
        try
        {
            BPTemplate template = bpTemplateRunner.runTemplateBuild(templateType, period, dateRanges, userId);
            return ResponseEntity.ok(template);
        }catch(DataException ex){
            log.error("Error creating budget template for user {}: {}", userId, ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
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
