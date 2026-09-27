package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.repositories.BPColumnRepository;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BPColumnService;
import com.app.budgetbuddy.services.BPTemplateDetailsService;
import com.app.budgetbuddy.services.BPTemplateService;
import com.app.budgetbuddy.workbench.budgetplanner.BPTemplateRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
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
    private final BPColumnRepository bpColumnRepository;
    private final BPTemplateDetailsService bpTemplateDetailsService;
    private final BPTemplateService bpTemplateService;

    @Autowired
    public BudgetPlannerController(BPTemplateRunner bpTemplateRunner,
                                   BPTemplateService bpTemplateService,
                                   BPColumnRepository bpColumnRepository,
                                   BPTemplateDetailsService bpTemplateDetailsService) {
        this.bpTemplateRunner = bpTemplateRunner;
        this.bpTemplateService = bpTemplateService;
        this.bpColumnRepository = bpColumnRepository;
        this.bpTemplateDetailsService = bpTemplateDetailsService;
    }


    @PutMapping("/resync/{templateId}")
    public ResponseEntity<BPTemplate> updateBudgetTemplateCategories(@PathVariable Long templateId,
                                                                     @RequestParam Long userId) {
        try
        {
            log.info("Updating budget template categories for template id {}", templateId);
            BPTemplate updatedTemplate = bpTemplateRunner.syncBPTemplate(templateId, userId);
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

    @PostMapping("/move-future-pointer")
    public ResponseEntity<BPTemplate> moveFuturePointerAndResyncTemplate(@RequestBody MoveFuturePointerRequest moveFuturePointerRequest)
    {
        try
        {
            LocalDate currentFuturePointerDate = moveFuturePointerRequest.currentPointerDate();
            LocalDate newFuturePointerDate = moveFuturePointerRequest.newPointerDate();
            Long templateDetailId = moveFuturePointerRequest.templateDetailId();
            DateRange dateRange = new DateRange(currentFuturePointerDate, newFuturePointerDate);
            BPTemplate bpTemplate = bpTemplateRunner.runFuturePointerTemplateBuild(templateDetailId, dateRange);
            return ResponseEntity.ok(bpTemplate);

            // Use the BPTemplateRunner to create/update bp columns that range from the current future pointer date to the newFuturePointerDate
            // Also create/update the futurePointer entity

        }catch(DataException ex){
            log.error("Error moving future pointer: {}", ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/date-range-lookup")
    public ResponseEntity<List<DateRange>> getDateRangeLookUpForPointerRequest(@RequestParam int ahead,
                                                                               @RequestParam FuturePointerRequest.AheadUnit units,
                                                                               @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate currentDate,
                                                                               @RequestParam Long templateDetailId)
    {
        try
        {
            log.info("Getting date range look up for pointer request ahead: {}, units: {}, templateDetailId: {}", ahead, units, templateDetailId);
            //TODO: Temporarily using LocalDate.now() until current pointer logic is implemented.
            DateRange horizon = new FuturePointerRequest(ahead, units, templateDetailId, false, List.of()).horizon(currentDate);
            List<BPColumnEntity> columnsEntities = bpColumnRepository.findByBpTemplateDetailIdAndRange(templateDetailId, horizon.getStartDate(), horizon.getEndDate());
            List<BPColumn> columns = columnsEntities.stream()
                    .map(bpColumnEntity -> {
                        BPColumn bpColumn = new BPColumn();
                        bpColumn.setColumnIndex(bpColumnEntity.getColumnIndex());
                        bpColumn.setDateRange(new DateRange(bpColumnEntity.getStartDate(), bpColumnEntity.getEndDate()));
                        bpColumn.setPeriod(bpColumnEntity.getPeriod());
                        bpColumn.setColumnType(bpColumnEntity.getColumnType());
                        return bpColumn;
                    })
                    .toList();
            if(columns.isEmpty())
            {
                return ResponseEntity.ok(List.of());
            }
            List<DateRange> foundDateRanges = columns.stream()
                    .map(BPColumn::getDateRange)
                    .toList();
            log.info("Found date ranges: {}", foundDateRanges);
            return ResponseEntity.ok(foundDateRanges);
        }catch(DataException ex)
        {
            log.error("Error getting date range look up for pointer request: {}", ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PutMapping("/add-future-date-ranges")
    public ResponseEntity<BPTemplate> addFutureDateRangesToBudgetTemplateDetail(@RequestBody FuturePointerRequest futurePointerRequest)
    {
        if(futurePointerRequest == null)
        {
            return ResponseEntity.badRequest().body(null);
        }
        Long templateDetailId = futurePointerRequest.templateId();
        LocalDate currentDate = LocalDate.now();
        boolean isManual = futurePointerRequest.isManual();
        DateRange futureDateRange = futurePointerRequest.horizon(currentDate);
        List<FuturePeriodCategories> futurePeriodCategories = futurePointerRequest.categories();
        try
        {
            return null;
        }catch(DataException ex)
        {
            log.error("Error adding future date ranges to budget template detail: {}", ex.getMessage());
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
            BPTemplate template = bpTemplateRunner.runTemplateBuild(templateType, period, dateRanges, userId, startDay);
            return ResponseEntity.ok(template);
        } catch (DataException ex) {
            log.error("Error creating budget template for user {}: {}", userId, ex.getMessage());
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/templates/{userId}")
    public ResponseEntity<List<BPTemplate>> getUserBudgetTemplates(@PathVariable Long userId) {
        try {
            List<BPTemplate> templates = bpTemplateService.getAllUserBudgetTemplates(userId);
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

}
