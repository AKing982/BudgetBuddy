package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserBudgetCategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Component
public class BudgetCategoryBuilder
{
    private UserBudgetCategoryService userBudgetCategoryService;
    private CategoryRuleService categoryRuleService;
    private CategoryService categoryService;
    private BudgetCalculator budgetCalculator;

    @Autowired
    public BudgetCategoryBuilder(UserBudgetCategoryService userBudgetCategoryService,
                                 CategoryRuleService categoryRuleService,
                                 CategoryService categoryService,
                                 BudgetCalculator budgetCalculator)
    {
        this.userBudgetCategoryService = userBudgetCategoryService;
        this.categoryRuleService = categoryRuleService;
        this.categoryService = categoryService;
        this.budgetCalculator = budgetCalculator;
    }

    private boolean isTransactionAlreadyLinked(Transaction transaction)
    {
        return false;
    }

    public List<TransactionsEntity> fetchTransactionsForPeriod(final LocalDate startDate, final LocalDate endDate, final Long userId)
    {
        return null;
    }

    public Category updateCategoryOnNewTransaction(Transaction transaction)
    {
        return null;
    }

    public boolean storeCategoriesInDatabase(Set<UserBudgetCategoryEntity> userBudgetCategories)
    {
        return false;
    }

    private UserEntity fetchUserEntityByUserId(Long userId)
    {
        return null;
    }

    public CategoryEntity fetchCategoryByNameOrDescription(String categoryName, String categoryDescription)
    {
        return null;
    }

    public BigDecimal getCategoryRemainingAmount(final BudgetPeriod budgetPeriod, final CategoryBudget categoryBudget)
    {
        return null;
    }

    public BigDecimal getCategoryActualAmount(final BudgetPeriod budgetPeriod, final CategoryBudget categoryBudget)
    {
        return null;
    }

    public BigDecimal getCategoryBudgetAmount(final BudgetPeriod budgetPeriod, final CategoryBudget categoryBudget)
    {
        return null;
    }

    // Maps the User
    public Map<Long, List<UserBudgetCategoryEntity>> initializeUserBudgetCategories(Budget budget, BudgetPeriod budgetPeriod)
    {
        return null;
    }

    public UserBudgetCategoryEntity createUserBudgetCategory(TransactionsEntity transactionsEntity)
    {
        return null;
    }

    public Category assignTransactionToCategoryByRule(CategoryRule categoryRule, Long userId)
    {
        return null;
    }

    public TransactionLink linkTransactionToCategory(Transaction transaction, Category category)
    {
        return null;
    }

    public DateRange createCategoryPeriod(final BudgetPeriod budgetPeriod, final Transaction transaction)
    {
        return null;
    }

    public List<UserBudgetCategoryEntity> detectAndUpdateNewTransactions()
    {
        return null;
    }

    public List<UserBudgetCategoryEntity> createUserBudgetCategoryFromTransaction(List<TransactionsEntity> transactionsEntities)
    {
        return null;
    }

}
