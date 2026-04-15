package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryGroupService;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import com.app.budgetbuddy.workbench.converter.BPBudgetCategoryConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
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
                        DateRange dateRange = column.getDateRange();
                        log.info("Date Range: {}", dateRange);
                        List<BudgetCategory> budgetCategories = budgetCategoryService
                                .getBudgetCategoriesByDateRange(dateRange.getStartDate(), dateRange.getEndDate(), userId);
                        log.info("Budget Categories: {}", budgetCategories);
                        return budgetCategories.stream()
                                .map(bc -> BPCategory.builder()
                                        .name(bc.getCategoryName())
                                        .type(BPType.BUDGET)
                                        .range(dateRange)
                                        .actual(BigDecimal.valueOf(bc.getBudgetActual()))
                                        .budgeted(BigDecimal.valueOf(bc.getBudgetedAmount()))
                                        .isActive(true)
                                        .columnIndex(column.getColumnIndex())
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
        log.info("Columns: {}", columns);
        try
        {
            List<BPAccountBalance> accountBalances = accountBalanceEngine.buildAccountBalances(columns, incomes, expenses);
            return columns.stream()
                    .map(column -> {
                        DateRange dateRange = column.getDateRange();
                        BPAccountBalance balance = accountBalances.get(column.getColumnIndex());
                        return BPCategory.builder()
                                .columnIndex(column.getColumnIndex())
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

    List<BPCategory> buildBudgetCategoryGroups(Long userId, List<String> categoryHeaders)
    {
        if(categoryHeaders == null || categoryHeaders.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            if(userId == null || userId < 0)
            {
                throw new DataException("User Id cannot be null");
            }
            return categoryHeaders.stream()
                    .map(header -> BPCategory.builder()
                            .name(header)
                            .type(BPType.HEADER)
                            .isGroupHeader(true)
                            .actual(BigDecimal.ZERO)
                            .budgeted(BigDecimal.ZERO)
                            .isActive(true)
                            .columnIndex(0)
                            .build())
                    .toList();
        }catch(DataException ex){
            log.error("There was an error building the budget category groups: ", ex);
            return Collections.emptyList();
        }
    }

    private Set<LocalDate> calculatePayDates(LocalDate lastPayDate, LocalDate nextPayDate, List<BPColumn> columns)
    {
        long payDayIntervals = ChronoUnit.DAYS.between(lastPayDate, nextPayDate);
        Set<LocalDate> payDates = new HashSet<>();
        LocalDate current = lastPayDate;
        LocalDate lastColumnEnd = columns.get(columns.size() - 1).getDateRange().getEndDate();
        while(!current.isAfter(lastColumnEnd))
        {
            payDates.add(current);
            current = current.plusDays(payDayIntervals);
        }
        return payDates;
    }

    List<BPCategory> buildBPIncomes(SubBudget subBudget, BPIncomeCriteria incomeCriteria, List<BPColumn> columns)
    {
        if(subBudget == null && incomeCriteria == null)
        {
            throw new DataException("Income and sub budget cannot both be null");
        }
        if(subBudget == null || columns == null || columns.isEmpty())
        {
            return Collections.emptyList();
        }
        Long subBudgetId = subBudget.getId();
//        try
//        {
            if(incomeCriteria != null)
            {
                LocalDate lastPayDate = incomeCriteria.lastPayDate();
                LocalDate nextPayDate = incomeCriteria.nextPayDate();
                PayPeriod payPeriod = incomeCriteria.payPeriod();
                BigDecimal income = incomeCriteria.monthlyIncome();
                Set<LocalDate> payDates = calculatePayDates(lastPayDate, nextPayDate, columns);
                return columns.stream()
                        .map(column -> {
                            DateRange dateRange = column.getDateRange();
                            boolean isPayPeriod = payDates.stream()
                                    .anyMatch(dateRange::containsDate);
                            BigDecimal payAmount = switch(payPeriod){
                                case BIWEEKLY, WEEKLY -> income.divide(new BigDecimal(2), 2, RoundingMode.HALF_UP);
                                case MONTHLY -> income;
                            };
                            return BPCategory.builder()
                                    .name("Salary")
                                    .type(BPType.INCOME)
                                    .range(dateRange)
                                    .actual(isPayPeriod ? payAmount : BigDecimal.ZERO)
                                    .budgeted(BigDecimal.ZERO)
                                    .isActive(true)
                                    .columnIndex(column.getColumnIndex())
                                    .build();
                        })
                        .toList();
            }
            else
            {
                return columns.stream()
                        .map(column -> {
                            DateRange dateRange = column.getDateRange();
                            LocalDate startDate = dateRange.getStartDate();
                            LocalDate endDate = dateRange.getEndDate();
                            BigDecimal totalIncome = budgetCategoryService.getTotalIncomeByDateRange(subBudgetId, startDate, endDate);
                            log.info("Total income: {}", totalIncome);
                            return BPCategory.builder()
                                    .name("Salary")
                                    .type(BPType.INCOME)
                                    .range(dateRange)
                                    .actual(totalIncome)
                                    .budgeted(BigDecimal.ZERO)
                                    .isActive(true)
                                    .columnIndex(column.getColumnIndex())
                                    .build();
                        })
                        .toList();
            }
//        }catch(DataException ex){
//            log.error("There was an error building the incomes: ", ex);
//            return Collections.emptyList();
//        }
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
                        DateRange dateRange = column.getDateRange();
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
                                .columnIndex(column.getColumnIndex())
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

    public List<BPCategory> buildRowData(SubBudget subBudget, boolean requireCategoryHeaders, List<String> categoryHeaders, BPIncomeCriteria incomeCriteria, List<BPColumn> columns)
    {
        Long userId = subBudget.getBudget().getUserId();
        List<BPCategory> allCategories = new ArrayList<>();
        List<BPCategory> budgetCategories = buildBPBudgetCategories(userId, columns);
        if(requireCategoryHeaders)
        {
            List<BPCategory> categoryGroups = buildBudgetCategoryGroups(userId, categoryHeaders);
            List<BPCategory> incomes = buildBPIncomes(subBudget, incomeCriteria, columns);
            List<BPCategory> expenses = buildBPExpenses(subBudget, columns);
            List<BPCategory> accountBalances = buildAccountBalances(columns, incomes, expenses);
            List<BPCategory> savings = buildBPSavings(subBudget, columns);
            allCategories.addAll(budgetCategories);
            allCategories.addAll(incomes);
            allCategories.addAll(expenses);
            allCategories.addAll(accountBalances);
            allCategories.addAll(categoryGroups);
            allCategories.addAll(savings);
            return allCategories;
        }
        List<BPCategory> incomes = buildBPIncomes(subBudget, incomeCriteria, columns);
        log.info("Incomes: {}", incomes);
        List<BPCategory> expenses = buildBPExpenses(subBudget, columns);
        log.info("Expenses: {}", expenses);
        List<BPCategory> accountBalances = buildAccountBalances(columns, incomes, expenses);
        List<BPCategory> savings = buildBPSavings(subBudget, columns);
        allCategories.addAll(budgetCategories);
        allCategories.addAll(incomes);
        allCategories.addAll(expenses);
        allCategories.addAll(accountBalances);
        allCategories.addAll(savings);
        return allCategories;
    }
}
