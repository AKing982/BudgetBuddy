package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.exceptions.BudgetCategoryException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.*;

import com.app.budgetbuddy.workbench.budget.BudgetCategoryBuilderFactory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.AnnotationConfigApplicationContext;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetCategoryRunner
{
    private List<BudgetCategory> budgetCategories = new ArrayList<>();
    private SubBudgetService subBudgetService;
    private SubBudgetGoalsService subBudgetGoalsService;
    private TransactionCategoryService transactionCategoryService;
    private TransactionService transactionService;
    private RecurringTransactionService recurringTransactionService;
    private BudgetCategoryBuilderFactory budgetCategoryBuilder;

    @Autowired
    public BudgetCategoryRunner(SubBudgetService subBudgetService,
                                SubBudgetGoalsService subBudgetGoalsService,
                                TransactionCategoryService transactionCategoryService,
                                TransactionService transactionService,
                                RecurringTransactionService recurringTransactionService,
                                BudgetCategoryBuilderFactory budgetCategoryBuilder) {
        this.subBudgetService = subBudgetService;
        this.subBudgetGoalsService = subBudgetGoalsService;
        this.transactionCategoryService = transactionCategoryService;
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.budgetCategoryBuilder = budgetCategoryBuilder;
    }

//    public void runBudgetCategoryProcess(LocalDate startDate, LocalDate endDate, Long userId)
//    {
//        // Load the transaction categories from the database
//        List<TransactionCategory> transactionCategories = loadTransactionCategoriesForUser(startDate, endDate, userId);
//
//        // Create the Category Transactions
//        List<CategoryTransactions> categoryTransactions = createCategoryTransactions(transactionCategories);
//
//        // Load the sub budget for this period
//        SubBudget subBudget = loadSubBudget(userId, startDate, endDate);
//        log.info("Loading SubBudget: {}", subBudget);
//
//        // Load the budget schedule for this period
//        BudgetSchedule budgetSchedule = getBudgetScheduleFromSubBudget(subBudget);
//        log.info("Loading BudgetSchedule: {}", budgetSchedule);
//
//        // Load the SubBudget goals for this period
//        SubBudgetGoals subBudgetGoals = subBudgetGoalsService.getSubBudgetGoalsEntitiesBySubBudgetId(subBudget.getId());
//        log.info("Loading SubBudgetGoals: {}", subBudgetGoals);
//
//        // Create the BudgetCategories
//        List<BudgetCategory> budgetCategories1 = createBudgetCategories(subBudget, budgetSchedule, categoryTransactions, subBudgetGoals);
//        budgetCategories1.forEach((budgetCategory) -> {
//            log.info("Loading BudgetCategory: {}", budgetCategory);
//        });
//        budgetCategories.addAll(budgetCategories1);
//
//        saveBudgetCategories(budgetCategories1);
//    }

    public List<TransactionCategory> loadTransactionCategoriesForUser(final LocalDate startDate, final LocalDate endDate, final Long userId)
    {
        if(startDate == null || endDate == null || userId == null)
        {
            return Collections.emptyList();
        }
        return transactionCategoryService.getTransactionCategoriesBetweenStartAndEndDates(startDate, endDate, userId);
    }

    private List<Transaction> getTransactionsFromTransactionCategories(final List<TransactionCategory> transactionCategories)
    {
        List<Transaction> transactions = new ArrayList<>();
        for(TransactionCategory transactionCategory : transactionCategories)
        {
            String transactionId = transactionCategory.getTransactionId();
            Optional<Transaction> optionalTransaction = transactionService.findTransactionById(transactionId);
            if(optionalTransaction.isEmpty())
            {
                continue;
            }
            Transaction transaction = optionalTransaction.get();
            transactions.add(transaction);
        }
        return transactions;
    }

    private BudgetSchedule getBudgetScheduleFromSubBudget(final SubBudget subBudget)
    {
        List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
        if(budgetSchedules.isEmpty())
        {
            throw new BudgetBuildException("Sub budget budget has no schedule");
        }
        return budgetSchedules.get(0);
    }

    private List<String> getMatchedCategoriesByTransactionCategories(final List<TransactionCategory> transactionCategories)
    {
        return transactionCategories
                .stream()
                .map(TransactionCategory::getMatchedCategory)
                .distinct()
                .toList();
    }

    public List<CategoryTransactions> createCategoryTransactions(final List<TransactionCategory> transactionCategories)
    {
        List<CategoryTransactions> categoryTransactions = new ArrayList<>();
        List<String> uniqueCategories = getMatchedCategoriesByTransactionCategories(transactionCategories);
        if(uniqueCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        for(String category : uniqueCategories)
        {
            if(category == null || category.isEmpty())
            {
                log.warn("Skipping Blank category....");
                continue;
            }
            Map<String, List<Transaction>> categoryTransactionMap = new HashMap<>();
            List<TransactionCategory> transactionCategoriesInGroup = getTransactionCategoriesGrouped(category, transactionCategories);
            if(transactionCategoriesInGroup.isEmpty())
            {
                return Collections.emptyList();
            }

//            List<Transaction> transactions = getTransactionsFromTransactionCategories(transactionCategoriesInGroup);
//            if(transactions.isEmpty())
//            {
//                categoryTransactions.add(new CategoryTransactions(category, new ArrayList<>()));
//            }
//            else
//            {
//                categoryTransactions.add(new CategoryTransactions(category, transactions));
//            }
        }
        return categoryTransactions;
    }

    private List<TransactionCategory> getTransactionCategoriesGrouped(final String category, final List<TransactionCategory> transactionCategories)
    {
        return transactionCategories
                .stream()
                .filter(tc -> category.equals(tc.getMatchedCategory()))
                .toList();
    }

    private SubBudget loadSubBudget(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, startDate, endDate);
            if(subBudgetOptional.isEmpty())
            {
                throw new RuntimeException("Sub budget not found");
            }
            return subBudgetOptional.get();
        }catch(DataAccessException e){
            log.error("There was an error fetching the sub budget for start date {} and end date {} and userId {}", startDate, endDate, userId, e);
            throw new DataAccessException("There was an error fetching the sub budget");
        }
    }

//    /**
//     * Creates the initial Budget Categories
//     *
//     * @param subBudget
//     * @param budgetSchedule
//     * @param categoryTransactions
//     */
//    public List<BudgetCategory> createBudgetCategories(final SubBudget subBudget, final BudgetSchedule budgetSchedule, final List<CategoryTransactions> categoryTransactions, final SubBudgetGoals subBudgetGoals)
//    {
//        if(subBudget == null || budgetSchedule == null || categoryTransactions == null || subBudgetGoals == null)
//        {
//            return Collections.emptyList();
//        }
//        try
//        {
//            List<BudgetCategory> budgetCategoriesList = budgetCategoryBuilder.initializeBudgetCategories(subBudget, budgetSchedule, categoryTransactions, subBudgetGoals);
//            log.info("Budget Categories size: {}", budgetCategoriesList.size());
//            return budgetCategoriesList;
//        }catch(BudgetCategoryException e)
//        {
//            log.error("There was an error building the budget categories: ", e);
//            return Collections.emptyList();
//        }
//    }

    /**
     * Updates current user Budget Categories using new Transactions
     * @param newTransactions
     * @param budget
     * @param budgetPeriod
     */
    public void updateBudgetCategories(List<Transaction> newTransactions, Budget budget, BudgetPeriod budgetPeriod)
    {

    }

    /**
//     * Persists the User Budget Categories to the database
//     * @param userBudgetCategories
//     */
//    public void saveBudgetCategories(List<BudgetCategory> userBudgetCategories)
//    {
//        log.info("Budget Categories Size: {}", userBudgetCategories.size());
//        if(userBudgetCategories.isEmpty())
//        {
//            return;
//        }
//        budgetCategoryBuilder.saveBudgetCategories(userBudgetCategories);
//    }

//    public static void main(String[] args)
//    {
//        AnnotationConfigApplicationContext context = new AnnotationConfigApplicationContext();
//        context.scan("com.app.budgetbuddy");
//        context.refresh();
//
//        BudgetCategoryRunner budgetCategoryRunner = context.getBean(BudgetCategoryRunner.class);
//
//        // Get transaction manager bean
//        PlatformTransactionManager transactionManager =
//                context.getBean(PlatformTransactionManager.class);
//
//
//        Long userId = 1L;
//        LocalDate startDate = LocalDate.now().withDayOfMonth(1);
//        LocalDate endDate = LocalDate.now().withDayOfMonth(30);
//        // Create transaction template
//        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
//        transactionTemplate.setPropagationBehavior(TransactionDefinition.PROPAGATION_REQUIRED);
//
//        try
//        {
//            System.out.println("Starting budget category process for user " + userId);
//            System.out.println("Date range: " + startDate + " to " + endDate);
//
//            transactionTemplate.execute(status -> {
//                try {
//                    budgetCategoryRunner.runBudgetCategoryProcess(startDate, endDate, userId);
//                    System.out.println("Budget category process completed successfully");
//                    return null;
//                } catch (Exception e) {
//                    status.setRollbackOnly();
//                    System.err.println("Error running budget category process: " + e.getMessage());
//                    e.printStackTrace();
//                    return null;
//                }
//            });
//
//
//            System.out.println("Budget category process completed successfully");
//        }catch(Exception e){
//            System.err.println("Error running budget category process: " + e.getMessage());
//            e.printStackTrace();
//        }
//    }
}
