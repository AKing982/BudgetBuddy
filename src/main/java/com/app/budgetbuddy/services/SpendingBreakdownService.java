package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetPeriod;
import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.SpendingCategory;
import com.plaid.client.model.DateRange;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class SpendingBreakdownService
{
    private final TransactionService transactionService;

    @Autowired
    public SpendingBreakdownService(TransactionService transactionService){
        this.transactionService = transactionService;
    }

    public List<SpendingCategory> getSpendingCategoriesByPeriod(BudgetPeriod budgetPeriod){
        return null;
    }

    public BigDecimal getTotalSpendingByCategory(SpendingCategory spendingCategory){
        return null;
    }

    public Map<Category, SpendingCategory> getSpendingBreakdownByPercentage(){
        return null;
    }

    public BigDecimal getAverageSpendingByCategory(SpendingCategory spendingCategory){
        return null;
    }

    public BigDecimal getTotalSpendingByCategoryAndPeriod(SpendingCategory spendingCategory, BudgetPeriod budgetPeriod){
        return null;
    }

    public BigDecimal getAverageSpendingByCategoryAndPeriod(SpendingCategory spendingCategory, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<String, SpendingCategory> getSpendingBreakdownByMerchant(BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<LocalDate, List<SpendingCategory>> getDailySpendingBreakdown(BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<DateRange, List<SpendingCategory>> getSpendingBreakdownOverDateRange(BudgetPeriod budgetPeriod){
        return null;
    }

}
