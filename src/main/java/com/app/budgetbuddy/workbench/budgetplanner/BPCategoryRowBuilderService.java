package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryGroupService;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.converter.BPBudgetCategoryConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BPCategoryRowBuilderService
{
    private final BPCategoryGroupService categoryGroupService;
    private final BudgetCategoryService budgetCategoryService;
    private final BPAccountBalanceEngine accountBalanceEngine;

    @Autowired
    public BPCategoryRowBuilderService(BPCategoryGroupService bpCategoryGroupService,
                                       BudgetCategoryService budgetCategoryService,
                                       BPAccountBalanceEngine bpAccountBalanceEngine)
    {
        this.categoryGroupService = bpCategoryGroupService;
        this.budgetCategoryService = budgetCategoryService;
        this.accountBalanceEngine = bpAccountBalanceEngine;
    }

    List<BPCategory> buildBPBudgetCategories(Long userId, List<BPColumn> columns)
    {
        if(userId == null || columns.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return columns.stream()
                    .flatMap(column -> {
                        DateRange dateRange = column.dateRange();
                        List<BudgetCategory> budgetCategories = budgetCategoryService
                                .getBudgetCategoriesByDateRange(dateRange.getStartDate(), dateRange.getEndDate(), userId);
                        return budgetCategories.stream()
                                .map(bc -> BPCategory.builder()
                                        .name(bc.getCategoryName())
                                        .type(BPType.BUDGET)
                                        .range(dateRange)
                                        .actual(BigDecimal.valueOf(bc.getBudgetActual()))
                                        .budgeted(BigDecimal.valueOf(bc.getBudgetedAmount()))
                                        .isActive(true)
                                        .columnIndex(column.columnIndex())
                                        .build());
                    })
                    .toList();
        }catch(DataException ex)
        {
            log.error("There was an error building the budget categories: ", ex);
            return Collections.emptyList();
        }
    }

    List<BPCategory> buildAccountBalances(List<BPColumn> columns, List<BPCategory> incomes, List<BPCategory> expenses)
    {
        if(columns.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<BPAccountBalance> accountBalances = accountBalanceEngine.buildAccountBalances(columns, incomes, expenses);
            return columns.stream()
                    .map(column -> {
                        DateRange dateRange = column.dateRange();
                        BPAccountBalance balance = accountBalances.get(column.columnIndex());
                        return BPCategory.builder()
                                .columnIndex(column.columnIndex())
                                .actual(balance.getCurrentBalance())
                                .budgeted(balance.getClosingBalance())
                                .name("Balance")
                                .type(BPType.BALANCE)
                                .range(dateRange)
                                .isActive(true)
                                .build();
                    })
                    .toList();
        }catch(DataException ex){
            log.error("There was an error building the account balances: ", ex);
            return Collections.emptyList();
        }
    }

    List<BPCategory> buildBudgetCategoryGroups(Long userId, Long templateDetailId)
    {
        if(userId == null)
        {
            return Collections.emptyList();
        }
        try
        {
            return categoryGroupService.findCategoryGroupsByTemplateDetailIdAndUserId(templateDetailId, userId).stream()
                    .map(group -> BPCategory.builder()
                            .name(group.getGroupName())
                            .type(BPType.BUDGET)
                            .isGroupHeader(true)
                            .isActive(true)
                            .actual(BigDecimal.ZERO)      // aggregated by renderer from children
                            .budgeted(BigDecimal.ZERO)    // aggregated by renderer from children
                            .lastAmount(BigDecimal.ZERO)
                            .build())
                    .toList();
        }catch(DataException ex){
            log.error("There was an error building the budget category groups: ", ex);
            return Collections.emptyList();
        }
    }

    List<BPCategory> buildBPIncomes(SubBudget subBudget, List<BPColumn> columns)
    {
        if(columns.isEmpty())
        {
            return Collections.emptyList();
        }
        Long subBudgetId = subBudget.getId();
        try
        {
            return columns.stream()
                    .map(column -> {
                        DateRange dateRange = column.dateRange();
                        LocalDate startDate = dateRange.getStartDate();
                        LocalDate endDate = dateRange.getEndDate();
                        BigDecimal totalIncome = budgetCategoryService.getTotalIncomeByDateRange(subBudgetId, startDate, endDate);
                        return BPCategory.builder()
                                .name("Salary")
                                .type(BPType.INCOME)
                                .range(dateRange)
                                .actual(totalIncome)
                                .budgeted(BigDecimal.ZERO)
                                .isActive(true)
                                .columnIndex(column.columnIndex())
                                .build();
                    })
                    .toList();
        }catch(DataException ex){
            log.error("There was an error building the incomes: ", ex);
            return Collections.emptyList();
        }
    }

    List<BPCategory> buildBPExpenses(SubBudget subBudget, List<BPColumn> columns)
    {
        if(subBudget == null || columns.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return columns.stream()
                    .map(column -> {
                        DateRange dateRange = column.dateRange();
                        LocalDate startDate = dateRange.getStartDate();
                        LocalDate endDate = dateRange.getEndDate();
                        BigDecimal totalExpenses = budgetCategoryService.getTotalExpensesByDateRange(subBudget.getId(), startDate, endDate);
                        return BPCategory.builder()
                                .name("Expenses")
                                .type(BPType.EXPENSE)
                                .range(dateRange)
                                .actual(totalExpenses)
                                .budgeted(BigDecimal.ZERO)
                                .isActive(true)
                                .columnIndex(column.columnIndex())
                                .build();
                    })
                    .toList();
        }catch(DataException ex){
            log.error("There was an error building the expenses: ", ex);
            return Collections.emptyList();
        }
    }

    List<BPCategory> buildBPSavings(SubBudget subBudget, List<BPColumn> columns)
    {
        if(subBudget == null || columns.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return List.of();
        }catch(DataException ex){
            log.error("There was an error building the savings: ", ex);
            return Collections.emptyList();
        }
    }

    public List<BPCategory> buildRowData(SubBudget subBudget, List<BPColumn> columns)
    {
        Long userId = subBudget.getBudget().getUserId();
        List<BPCategory> allCategories = new ArrayList<>();
        List<BPCategory> budgetCategories = buildBPBudgetCategories(userId, columns);
//        List<BPCategory> categoryGroups = buildBudgetCategoryGroups(userId);
        List<BPCategory> incomes = buildBPIncomes(subBudget, columns);
        List<BPCategory> expenses = buildBPExpenses(subBudget, columns);
        List<BPCategory> accountBalances = buildAccountBalances(columns, incomes, expenses);
        List<BPCategory> savings = buildBPSavings(subBudget, columns);
        allCategories.addAll(budgetCategories);
        allCategories.addAll(incomes);
        allCategories.addAll(expenses);
        allCategories.addAll(accountBalances);
//        allCategories.addAll(categoryGroups);
        allCategories.addAll(savings);
        return allCategories;
    }
}
