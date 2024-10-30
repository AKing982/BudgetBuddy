package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Component
public class BudgetCategoryBuilder
{
    private UserBudgetCategoryService userBudgetCategoryService;
    private CategoryService categoryService;
    private BudgetCalculator budgetCalculator;

    @Autowired
    public BudgetCategoryBuilder(UserBudgetCategoryService userBudgetCategoryService,
                                 CategoryService categoryService,
                                 BudgetCalculator budgetCalculator)
    {
        this.userBudgetCategoryService = userBudgetCategoryService;
        this.categoryService = categoryService;
        this.budgetCalculator = budgetCalculator;
    }

    public List<TransactionsEntity> fetchTransactionsForPeriod(final LocalDate startDate, final LocalDate endDate, final Long userId)
    {
        return null;
    }

    public void saveUserBudgetCategories(final List<UserBudgetCategoryEntity> userBudgetCategories)
    {

    }

    private UserEntity fetchUserEntityByUserId(Long userId)
    {
        return null;
    }

    public CategoryEntity fetchCategoryByNameOrDescription(String categoryName, String categoryDescription)
    {
        return null;
    }

    public BigDecimal getCategoryActualAmount(Budget budget, BudgetPeriod budgetPeriod)
    {
        return null;
    }

    public BigDecimal getCategoryBudgetAmount(Budget budget, BudgetPeriod budgetPeriod)
    {
        return null;
    }

    public Map<Long, List<UserBudgetCategoryEntity>> initializeUserBudgetCategories(Budget budget, BudgetPeriod budgetPeriod)
    {
        return null;
    }

    public UserBudgetCategoryEntity createUserBudgetCategory(TransactionsEntity transactionsEntity)
    {
        return null;
    }

    // Calculates remaining budget amount for a given category and budget
    public BigDecimal calculateRemainingBudgetAmountForCategory(final Category category, final Budget budget) {
        // Implementation
        return null;
    }

    public List<UserBudgetCategoryEntity> createUserBudgetCategoryFromTransaction(List<TransactionsEntity> transactionsEntities)
    {
        return null;
    }

}
