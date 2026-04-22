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

    List<BPCategory> buildBPBudgetCategories(Long userId, List<BPColumn> columns, boolean isIncome)
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
                        List<BudgetCategory> budgetCategories = isIncome
                                ? budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(dateRange.getStartDate(), dateRange.getEndDate(), userId)
                                : budgetCategoryService.getBudgetCategoriesByDateRange(dateRange.getStartDate(), dateRange.getEndDate(), userId);
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
            List<BPCategory> balances = new ArrayList<>();
            for(int i = 0; i < columns.size(); i++)
            {
                BPColumn column = columns.get(i);
                BPAccountBalance balance = accountBalances.get(i);
                BPCategory balanceCategory = BPCategory.builder()
                        .columnIndex(column.getColumnIndex())
                        .actual(balance.getCurrentBalance())
                        .budgeted(balance.getClosingBalance())
                        .name("Balance")
                        .type(BPType.BALANCE)
                        .range(column.getDateRange())
                        .isActive(true)
                        .build();
                balances.add(balanceCategory);
            }
            return balances;

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

    private BigDecimal getTotalIncomeForIncomeTemplate(LocalDate startDate, LocalDate endDate, Long userId)
    {
        BigDecimal csvIncome = budgetCategoryService.getTotalCSVIncomesByDateRangeOverlaps(startDate, endDate, userId);
        BigDecimal income = budgetCategoryService.getTotalIncomesByDateRangeOverlaps(startDate, endDate, userId);
        return csvIncome.add(income);
    }

    List<BPCategory> buildBPIncomes(SubBudget subBudget, BPIncomeCriteria incomeCriteria, List<BPColumn> columns, boolean isIncomeTemplate)
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
        Long userId = subBudget.getBudget().getUserId();
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
                            BigDecimal totalIncome = isIncomeTemplate
                                    ? getTotalIncomeForIncomeTemplate(startDate, endDate, userId)
                                    : budgetCategoryService.getTotalIncomeByDateRange(subBudgetId, startDate, endDate);
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

    private BigDecimal getIncomeTemplateExpenses(LocalDate startDate, LocalDate endDate, Long userId)
    {
        BigDecimal csvExpenses = budgetCategoryService.getTotalCSVExpensesByDateRangeOverlaps(startDate, endDate, userId);
        BigDecimal expenses = budgetCategoryService.getTotalExpensesByDateRangeOverlaps(startDate, endDate, userId);
        return csvExpenses.add(expenses);
    }

    List<BPCategory> buildBPExpenses(SubBudget subBudget, List<BPColumn> columns, boolean isIncomeTemplate)
    {
        if(subBudget == null || columns.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            Long userId = subBudget.getBudget().getUserId();
            return columns.stream()
                    .map(column -> {
                        DateRange dateRange = column.getDateRange();
                        LocalDate startDate = dateRange.getStartDate();
                        LocalDate endDate = dateRange.getEndDate();
                        BigDecimal totalExpenses = isIncomeTemplate
                                ? getIncomeTemplateExpenses(startDate, endDate, userId)
                                : budgetCategoryService.getTotalExpensesByDateRange(subBudget.getId(), startDate, endDate);
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

    public List<BPCategory> buildRowData(boolean isIncomeTemplate, SubBudget subBudget, boolean requireCategoryHeaders, List<String> categoryHeaders, BPIncomeCriteria incomeCriteria, List<BPColumn> columns)
    {
        Long userId = subBudget.getBudget().getUserId();
        List<BPCategory> allCategories = new ArrayList<>();
        List<BPCategory> budgetCategories = buildBPBudgetCategories(userId, columns, isIncomeTemplate);
        if(requireCategoryHeaders)
        {
            List<BPCategory> categoryGroups = buildBudgetCategoryGroups(userId, categoryHeaders);
            List<BPCategory> incomes = buildBPIncomes(subBudget, incomeCriteria, columns, isIncomeTemplate);
            List<BPCategory> expenses = buildBPExpenses(subBudget, columns, isIncomeTemplate);
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
        List<BPCategory> incomes = buildBPIncomes(subBudget, incomeCriteria, columns, isIncomeTemplate);
        List<BPCategory> expenses = buildBPExpenses(subBudget, columns, isIncomeTemplate);
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
