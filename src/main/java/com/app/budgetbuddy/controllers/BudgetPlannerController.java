package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.workbench.budgetplanner.BPTemplateRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
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
    public BudgetPlannerController(BPTemplateRunner bpTemplateRunner) {
        this.bpTemplateRunner = bpTemplateRunner;
    }

    @PutMapping("/update-template-categories/{templateId}")
    public ResponseEntity<BPTemplate> updateBudgetTemplateCategories(@PathVariable Long templateId,
                                                                     @RequestParam Long userId) {
        try {
            BPTemplate updatedTemplate = bpTemplateRunner.updateBPTemplateCategories(templateId, userId);
            return ResponseEntity.ok(updatedTemplate);
        } catch (DataException ex) {
            log.error("Error updating budget template categories: {}", ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PutMapping("/update-template-period/{templateId}")
    public ResponseEntity<BPTemplate> updateBudgetTemplatePeriod(@PathVariable Long templateId,
                                                                 @RequestParam Long userId,
                                                                 @RequestParam Period period) {
        return null;
    }

    @PostMapping("/create-default/{userId}")
    public ResponseEntity<BPTemplate> createDefaultBudgetTemplate(@PathVariable Long userId) {
        try {
            BPTemplate bpTemplate = bpTemplateRunner.runDefaultTemplateBuild(userId);
            return ResponseEntity.ok(bpTemplate);
        } catch (DataException ex) {
            log.error("Error creating default budget template: {}", ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PostMapping("/create-template")
    public ResponseEntity<BPTemplate> createBudgetTemplate(@RequestBody BudgetPlannerRequest request) {
        if (request == null) {
            return ResponseEntity.badRequest().body(null);
        }
        Long userId = request.userId();
        List<DateRange> dateRanges = request.dateRanges();
        BPTemplateType templateType = request.templateType();
        Period period = request.period();
        boolean isCustom = request.isCustom();
        boolean requireCategoryHeaders = request.requireHeaders();
        List<String> categoryHeaders = request.categoryHeaders();
        List<CategoryAllocation> categoryAllocations = request.categoryAllocations();
        BPIncomeCriteria incomeCriteria = request.incomeCriteria();
        Integer startDay = request.startDay();
        try {
            if (isCustom) {
                BPTemplate template = bpTemplateRunner.runCustomTemplateBuild(templateType, period, requireCategoryHeaders, dateRanges, categoryHeaders, categoryAllocations, incomeCriteria);
                return ResponseEntity.ok(template);
            }
            BPTemplate template = bpTemplateRunner.runTemplateBuild(templateType, period, requireCategoryHeaders, categoryHeaders, dateRanges, incomeCriteria, userId, startDay);
            return ResponseEntity.ok(template);
        } catch (DataException ex) {
            log.error("Error creating budget template for user {}: {}", userId, ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/templates/{userId}")
    public ResponseEntity<List<BPTemplate>> getUserBudgetTemplates(@PathVariable Long userId) {
        try {
            List<BPTemplate> templates = bpTemplateRunner.getUserBudgetTemplates(userId);
            log.info("Budget templates: {}", templates);
            return ResponseEntity.ok(templates);
        } catch (DataException ex) {
            log.error("Error getting budget templates for user {}: {}", userId, ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/template-name/{userId}")
    public ResponseEntity<BPTemplate> getUserBudgetTemplateByName(@PathVariable Long userId,
                                                                  @RequestParam String templateName) {
        return null;
    }

    @PutMapping("/{id}/update-template")
    public ResponseEntity<BPTemplate> updateBudgetTemplate(@PathVariable Long id,
                                                           @RequestBody BudgetPlannerRequest request) {
        return null;
    }

    @PutMapping("/{id}/update-category-amounts")
    public ResponseEntity<BPTemplate> updateBudgetTemplateCategoryAmounts(@PathVariable Long id,
                                                                          @RequestBody FuturePeriodRequest futurePeriodRequest)
    {
        try
        {
            log.info("Updating budget template category amounts for template id {}", id);
            DateRange dateRange = futurePeriodRequest.dateRange();
            log.info("Date Range: {}", dateRange);
            List<FuturePeriodCategories> futurePeriodCategories = futurePeriodRequest.categories();
            log.info("Future Period Categories: {}", futurePeriodCategories);
            Long userId = futurePeriodRequest.userId();
            log.info("User ID: {}", userId);
            BPTemplate template = bpTemplateRunner.runFuturePeriodTemplateBuild(id, userId, dateRange, futurePeriodCategories);
            return ResponseEntity.ok(template);
        }catch(DataException ex){
            log.error("Error updating budget template category amounts: {}", ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
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
