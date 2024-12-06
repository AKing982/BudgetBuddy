package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.support.AbstractLobCreatingPreparedStatementCallback;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

@Component
@Slf4j
public class BudgetSetupEngine
{
    private final UserService userService;
    private final BudgetService budgetService;
    private final CategoryService categoryService;
    private final BudgetCalculations budgetCalculations;
    private final TransactionCategoryBuilder budgetCategoryBuilder;

    @Autowired
    public BudgetSetupEngine(UserService userService,
                             BudgetService budgetService,
                             CategoryService categoryService,
                             BudgetCalculations budgetCalculator,
                             TransactionCategoryBuilder budgetCategoryBuilder){
        this.userService = userService;
        this.budgetService = budgetService;
        this.categoryService = categoryService;
        this.budgetCalculations = budgetCalculator;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
    }

    private Budget loadUserBudget(Long userId)
    {
        try
        {
            if(userId < 1L)
            {
                throw new InvalidUserIDException("Invalid UserID found: " + userId);
            }
            return budgetService.loadUserBudget(userId);
        }catch(InvalidUserIDException e){
            log.error("There was an error with the userId: ", e);
            throw e;
        }
    }
    
    public void setupBudgetPeriodData(Long userId, BudgetPeriod budgetPeriod)
    {

    }

    private BudgetGoalsEntity loadUserBudgetGoals(Long userId)
    {
        return null;
    }

    public List<TransactionLink> linkRecurringTransactionsToCategoryByDateRange(final List<RecurringTransaction> recurringTransactions, final DateRange dateRange){
        return null;
    }

    public List<TransactionLink> linkTransactionsToCategoryByDateRange(final List<Transaction> transactions, final DateRange dateRange){
        return null;
    }

    /**
     * Initializes the entire budget setup process
     * @return
     */
    public Boolean budgetSetupInitializer(){
        return null;
    }

    /**
     * Initializes all the default UserBudgetCategories
     * @param userId
     * @param transactions
     * @param recurringTransactions
     * @param budgetPeriod
     * @return
     */
    public List<TransactionCategory> initializeDefaultUserBudgetCategories(final Long userId, final List<Transaction> transactions, final List<RecurringTransaction> recurringTransactions, final BudgetPeriod budgetPeriod)
    {
        List<TransactionCategory> userBudgetCategories = new ArrayList<>();
        if(transactions.isEmpty() || recurringTransactions.isEmpty() || budgetPeriod == null)
        {
            return userBudgetCategories;
        }
        LocalDate startDate = budgetPeriod.startDate();
        LocalDate endDate = budgetPeriod.endDate();
        Period period = budgetPeriod.period();
        validateBudgetPeriodDates(startDate, endDate, period);

        // Obtain the budget data the user created during the questionnaire phase.
        Budget budget = loadUserBudget(userId);
        // If the user has no budget then return an empty list
        if(budget == null)
        {
            return userBudgetCategories;
        }
        else
        {
            List<TransactionCategory> userBudgetCategoriesTransactions = budgetCategoryBuilder.initializeUserBudgetCategories(budget, budgetPeriod, transactions);
            if(!userBudgetCategoriesTransactions.isEmpty())
            {
               userBudgetCategories.addAll(userBudgetCategoriesTransactions);
            }

            List<TransactionCategory> userBudgetCategoriesRecurringTransactions = budgetCategoryBuilder.initializeUserBudgetCategories(budget, budgetPeriod, recurringTransactions);
            if(!userBudgetCategoriesRecurringTransactions.isEmpty())
            {
                userBudgetCategories.addAll(userBudgetCategoriesRecurringTransactions);
            }
        }
        return userBudgetCategories;
    }

    private void validateBudgetPeriodDates(LocalDate startDate, LocalDate endDate, Period period)
    {
        try
        {
            if(startDate == null || endDate == null){
                throw new IllegalDateException("Start date or End date cannot be null");
            }
        }catch(IllegalDateException e){
            log.error("There was an error fetching budget period dates: ", e);
            throw e;
        }

    }

    public List<TransactionCategoryEntity> convertUserBudgetCategoriesToEntities(final List<TransactionCategory> userBudgetCategories)
    {
        return null;
    }


    /**
     * Initializes the Budget Category's when the user creates a controlling spending plan
     * @param categories
     * @return
     */
    public List<ControlledBudgetCategory> createControlledSpendingCategories(final Budget budget, final BudgetGoals budgetGoals, final List<CategoryQuestionnaireData> categories){
        List<ControlledBudgetCategory> controlledBudgetCategories = new ArrayList<>();
        if(categories.isEmpty())
        {
            return controlledBudgetCategories;
        }

        BigDecimal budgetAmount = budget.getBudgetAmount();
        // Fetch the budget goals
        double targetAmount = budgetGoals.targetAmount();
        double currentMonthlyAllocation = budgetGoals.monthlyAllocation();
        double currentSavings = budgetGoals.currentSavings();
        for(CategoryQuestionnaireData categoryQuestionnaireData : categories)
        {
            if(categoryQuestionnaireData != null)
            {
                try
                {
                    String categoryName = categoryQuestionnaireData.getCategoryName();
                    double currentSpending = categoryQuestionnaireData.getCurrentSpending();
                    double spendingLimit = categoryQuestionnaireData.getSpendingLimit();
                    int priority = categoryQuestionnaireData.getPriority();
                    Double categoryAllocatedAmount = budgetCalculations.calculateAllocatedAmount(budgetAmount, targetAmount, currentMonthlyAllocation, currentSpending, spendingLimit, currentSavings);
                    ControlledBudgetCategory controlledBudgetCategory = new ControlledBudgetCategory(budget.getId(), categoryName, categoryAllocatedAmount, spendingLimit, currentSpending, false, true,  priority);
                    controlledBudgetCategories.add(controlledBudgetCategory);

                }catch(NumberFormatException e)
                {
                    log.error("There was an error calculating the category allocation amount for category: " + categoryQuestionnaireData.getCategoryName(), e);
                    throw e;
                }
            }
        }
        return controlledBudgetCategories;
    }

    public Category initializeIncomeCategory(final List<RecurringTransaction> recurringTransactions){
        Category incomeCategory = null;
        for(RecurringTransaction recurringTransaction : recurringTransactions){
            String categoryId = recurringTransaction.getCategoryId();
            if(!categoryId.isEmpty()){
                CategoryEntity category = categoryService.findCategoryById(categoryId).get();
                String categoryName = category.getName();
                String categoryDescription = category.getDescription();
                if(categoryName.equals("Payroll"))
                {
                    BigDecimal incomeAmount = BigDecimal.valueOf(Math.abs(recurringTransaction.getAverageAmount().intValue()));
                    LocalDate firstIncomeDate = recurringTransaction.getFirstDate();
                    LocalDate lastIncomeDate = recurringTransaction.getLastDate();
                    incomeCategory = new Category(categoryId, categoryName, categoryDescription, incomeAmount, firstIncomeDate, lastIncomeDate, BigDecimal.ZERO, true, CategoryType.PAYMENT);
                }
            }
        }
        return incomeCategory;
    }

    public Map<LocalDate, List<BudgetStats>> initializeUserBudgetStatistics(Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    /**
     * Initializes the Category's for a particular user
     * @param transactions
     * @param budgetCategories
     * @param userId
     * @param budgetPeriod
     * @return
     */
    public TreeMap<Long, List<Category>> initializeUserCategories(List<Transaction> transactions, List<ControlledBudgetCategory> budgetCategories, Long userId, BudgetPeriod budgetPeriod){
        return null;
    }

    public Category initializeBudgetExpenses(List<Transaction> transactions, Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    public Category initializeBudgetSavings(List<Transaction> transactions, Budget budget, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<Long, List<Category>> loadTopBudgetExpenseCategories(final List<Transaction> transactions, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<String, Category> loadBudgetPeriodCategories(final BudgetPeriod budgetPeriod, final Budget budget){
        return null;
    }


}
