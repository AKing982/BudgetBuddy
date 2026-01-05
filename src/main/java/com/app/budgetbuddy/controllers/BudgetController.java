package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCreateRequest;
import com.app.budgetbuddy.domain.ManageBudgetData;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.services.BudgetService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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

    @GetMapping("/check-if-budget-exists/{userId}/{year}")
    public ResponseEntity<Boolean> checkBudgetYearExistsByUserIdAndYear(@PathVariable Long userId,
                                                                        @PathVariable int year)
    {
        try
        {
            boolean exists = budgetService.validateBudgetExistsForYear(userId, year);
            LOGGER.info("Budget exists: {}", exists);
            return ResponseEntity.ok().body(exists);
        }catch(Exception e){
            LOGGER.error("There was an error while checking if budget exists", e);
            return ResponseEntity.internalServerError().body(false);
        }
    }


    @GetMapping("/{id}")
    public ResponseEntity<BudgetEntity> getBudgetById(@PathVariable Long id){
        if(id < 1L){
            return ResponseEntity.badRequest().body(null);
        }
        try
        {
            Optional<BudgetEntity> budgetEntityOptional = budgetService.findById(id);
            return budgetEntityOptional.map(budgetEntity -> ResponseEntity.ok().body(budgetEntity)).orElseGet(() -> ResponseEntity.notFound().build());
        }catch(Exception e){
            LOGGER.error("There was an error while getting the budget", e);
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @GetMapping("/{userId}/{year}")
    public ResponseEntity<List<ManageBudgetData>> getBudgetByUserIdAndYear(@PathVariable Long userId, @PathVariable int year)
    {
        try
        {
            List<BudgetEntity> budgets = budgetService.getBudgetsByUserIdAndYear(userId, year);
            List<ManageBudgetData> manageBudgetDataList = convertBudgetsToManageBudgetData(budgets);
            LOGGER.info("Budgets: {}", manageBudgetDataList);
            if(manageBudgetDataList.isEmpty()){
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok().body(manageBudgetDataList);
        }catch(Exception e){
            LOGGER.error("There was an error while getting the budget", e);
            return ResponseEntity.internalServerError().body(null);
        }
    }

    private List<ManageBudgetData> convertBudgetsToManageBudgetData(List<BudgetEntity> budgets)
    {
        List<ManageBudgetData> manageBudgetDataList = new ArrayList<>();
        for(BudgetEntity budget : budgets)
        {
            ManageBudgetData manageBudgetData = ManageBudgetData.builder()
                    .budgetYear(budget.getYear())
                    .savingsAmount(budget.getActualSavingsAllocation())
                    .userFirstName(budget.getUser().getFirstName())
                    .userLastName(budget.getUser().getLastName())
                    .userId(budget.getUser().getId())
                    .yearlyIncome(budget.getMonthlyIncome())
                    .budgetName(budget.getBudgetName())
                    .budgetDescription(budget.getBudgetDescription())
                    .budgetPeriod(budget.getBudgetPeriod())
                    .budgetMode(budget.getBudgetMode())
                    .budgetId(budget.getId())
                    .build();
            manageBudgetDataList.add(manageBudgetData);
        }
        return manageBudgetDataList;
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateBudget(@PathVariable Long id, @RequestBody BudgetCreateRequest budget){
        if((budget.budgetDescription() == null || budget.budgetDescription().isEmpty()) ||
                budget.budgetAmount() == null || budget.budgetAmount().compareTo(BigDecimal.ONE) < 1
                || budget.endDate() == null || budget.startDate() == null || budget.monthlyIncome() == null
                || (budget.budgetName() == null || budget.budgetName().isEmpty()) || budget.userId() == null){
            return ResponseEntity.badRequest().body("Invalid budget request");
        }
        return null;
    }

    @GetMapping("/budget-type/{userId}")
    public ResponseEntity<?> getBudgetByUserId(@PathVariable Long userId){
        if(userId < 1L){
            return ResponseEntity.badRequest().body(null);
        }
        try
        {
            List<BudgetEntity> userBudgets = budgetService.getBudgetByUserId(userId);
            return ResponseEntity.ok().body(userBudgets);

        }catch(Exception e){
            LOGGER.error("There was an error while getting the budget", e);
            return ResponseEntity.internalServerError().body(null);
        }
    }
}
