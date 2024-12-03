package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetService;
import com.app.budgetbuddy.services.UserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.support.AbstractLobCreatingPreparedStatementCallback;
import org.springframework.stereotype.Component;

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
    private final BudgetCalculations budgetCalculations;
    private final BudgetCategoryBuilder budgetCategoryBuilder;
    private boolean isBudgetSetupCompleted;

    @Autowired
    public BudgetSetupEngine(UserService userService,
                             BudgetService budgetService,
                             BudgetCalculations budgetCalculator,
                             BudgetCategoryBuilder budgetCategoryBuilder){
        this.userService = userService;
        this.budgetService = budgetService;
        this.budgetCalculations = budgetCalculator;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
    }

    private Budget loadUserBudget(Long userId)
    {
        return null;
    }
    
    public void setupBudgetPeriodData(Long userId, BudgetPeriod budgetPeriod)
    {

    }

    private BudgetGoalsEntity loadUserBudgetGoals(Long userId)
    {
        return null;
    }

    private Map<Long, SavingsGoal> loadUserSavingsGoal(Long userId)
    {
        return null;
    }

    public BudgetCategoriesEntity loadUserBudgetCategories(Long userId){
        return null;
    }

    public Boolean userBudgetCategoryExists(final UserBudgetCategory userBudgetCategory){
        return null;
    }



    public void linkRecurringTransactionsToCategoryByDateRange(final List<RecurringTransaction> recurringTransactions, final DateRange dateRange){

    }

    public void linkTransactionsToCategoryByDateRange(final List<Transaction> transactions, final DateRange dateRange){

    }

    /**
     * Initializes all the default UserBudgetCategories
     * @param userId
     * @param transactions
     * @param recurringTransactions
     * @param budgetPeriod
     * @return
     */
    public List<UserBudgetCategory> initializeDefaultUserBudgetCategories(final Long userId, final List<Transaction> transactions, final List<RecurringTransaction> recurringTransactions, final BudgetPeriod budgetPeriod)
    {
        List<UserBudgetCategory> userBudgetCategories = new ArrayList<>();
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
            List<UserBudgetCategory> userBudgetCategoriesTransactions = budgetCategoryBuilder.initializeUserBudgetCategories(budget, budgetPeriod, transactions);
            if(!userBudgetCategoriesTransactions.isEmpty())
            {
                String budgetType = budget.getBudgetName();
                if(budgetType.contains("Controlling Spending"))
                {

                }
                else
                {

                }
            }
        }

        // Create the User BudgetCategories for the Transactions

        // Create the User Budget Categories for the Recurring Transactions

        // Is the user using a controlling spending plan? If so, does the user have existing User Budget Categories?
        // If it does exist, then skip adding the User Budget Category

        // Filter the recurring transactions on active recurring transactions

        //

        // 1. Using the Budget Period, build the Date Ranges for the category

        // 2. Initialize the UserBudgetCategories through the Budget Category builder

        return null;
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

    public void budgetInitializer(Budget budget, List<Category> categories, List<BudgetStats> budgetStats, BudgetPeriod budgetPeriod){

    }

    public List<UserBudgetCategoryEntity> createUserBudgetCategories(Budget budget, BudgetPeriod budgetPeriod)
    {
        return null;
    }

    public Boolean checkIfBudgetCategoriesExist(){
        return false;
    }

    /**
     * Initializes the Budget Category's when the user creates a controlling spending plan
     * @param categories
     * @param budgetPeriod
     * @param userId
     * @return
     */
    public List<BudgetCategory> createInitialBudgetCategories(List<Category> categories, BudgetPeriod budgetPeriod, Long userId){
        return List.of();
    }

    public Category initializeIncomeCategory(List<RecurringTransactionDTO> recurringTransactions, Long userId, BudgetPeriod budgetPeriod){
        return null;
    }

    public Map<LocalDate, List<BudgetStats>> initializeUserBudgetStatistics(Long budgetId, Budget budget, BudgetPeriod budgetPeriod){
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
    public TreeMap<Long, List<Category>> initializeUserCategories(List<Transaction> transactions, List<BudgetCategory> budgetCategories, Long userId, BudgetPeriod budgetPeriod){
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
