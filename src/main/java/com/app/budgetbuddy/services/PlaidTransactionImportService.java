//package com.app.budgetbuddy.services;
//
//import com.app.budgetbuddy.domain.BudgetCategory;
//import com.app.budgetbuddy.domain.SubBudget;
//import com.app.budgetbuddy.domain.Transaction;
//import com.app.budgetbuddy.domain.TransactionCategory;
//import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
//import com.app.budgetbuddy.workbench.runner.BudgetCategoryRunner;
//import com.app.budgetbuddy.workbench.runner.CategoryRuleRunner;
//import com.plaid.client.model.TransactionsCategoryRule;
//import com.plaid.client.model.TransactionsGetResponse;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.stereotype.Service;
//
//import java.io.IOException;
//import java.time.LocalDate;
//import java.util.Collections;
//import java.util.List;
//import java.util.Optional;
//
//@Service
//@Slf4j
//public class PlaidTransactionImportService
//{
//    private final PlaidTransactionManager plaidTransactionManager;
//    private final TransactionServiceFactoryImpl transactionServiceFactory;
//    private final CategoryRuleRunner categoryRuleRunner;
//    private final BudgetCategoryRunner budgetCategoryRunner;
//    private final SubBudgetService subBudgetService;
//
//    @Autowired
//    public PlaidTransactionImportService(PlaidTransactionManager plaidTransactionManager,
//                                         TransactionServiceFactoryImpl transactionServiceFactory,
//                                         CategoryRuleRunner categoryRuleRunner,
//                                         BudgetCategoryRunner budgetCategoryRunner,
//                                         SubBudgetService subBudgetService)
//    {
//        this.plaidTransactionManager = plaidTransactionManager;
//        this.transactionServiceFactory = transactionServiceFactory;
//        this.categoryRuleRunner = categoryRuleRunner;
//        this.budgetCategoryRunner = budgetCategoryRunner;
//        this.subBudgetService = subBudgetService;
//    }
//
//    private TransactionService getTransactionService(){
//        return transactionServiceFactory.getFactory(false).createTransactionService();
//    }
//
//    private List<Transaction> fetchTransactionsForDateFromPlaid(Long userId, LocalDate date) throws IOException
//    {
//        TransactionsGetResponse transactionResponse = plaidTransactionManager.getTransactionsForUser(userId, date, date);
//        List<com.plaid.client.model.Transaction> plaidTransactions = transactionResponse.getTransactions();
//        TransactionService transactionService = transactionServiceFactory.getFactory(false).createTransactionService();
//        return transactionService.convertPlaidTransactions(plaidTransactions);
//    }
//
//    private List<Transaction> fetchTransactionsFromPlaid(Long userId, LocalDate startDate, LocalDate endDate) throws IOException
//    {
//        TransactionsGetResponse transactionsGetResponse = plaidTransactionManager.getTransactionsForUser(userId, startDate, endDate);
//        List<com.plaid.client.model.Transaction> plaidTransactions = transactionsGetResponse.getTransactions();
//        TransactionService transactionService = transactionServiceFactory.getFactory(false).createTransactionService();
//        return transactionService.convertPlaidTransactions(plaidTransactions);
//    }
//
//    public List<BudgetCategory> runTransactionImportForPeriod(Long userId, LocalDate startDate, LocalDate endDate) throws IOException
//    {
//        List<Transaction> transactions = fetchTransactionsFromPlaid(userId, startDate, endDate);
//        TransactionService transactionService = getTransactionService();
//        transactionService.saveAll(transactions);
//
//        categoryRuleRunner.runTransactionCategorization(transactions);
//        log.info("Getting subBudget for userId {} and start date {} and end date {}", userId, startDate, endDate);
//        Optional<SubBudget> subBudgetOptional = subBudgetService.findSubBudgetByUserIdAndDateRange(userId, startDate, endDate);
//        if(subBudgetOptional.isEmpty())
//        {
//            log.info("No SubBudget found for userId {} and start date {} and end date {}", userId, startDate, endDate);
//            return Collections.emptyList();
//        }
//        SubBudget subBudget = subBudgetOptional.get();
//        log.info("SubBudget {}", subBudget);
//        log.info("Running budget category creation....");
//        return budgetCategoryRunner.runBudgetCategoryProcessForMonth(subBudget);
//    }
//
//    public boolean runTransactionImportForDate(Long userId, LocalDate date) throws IOException
//    {
//        List<Transaction> transactions = fetchTransactionsForDateFromPlaid(userId, date);
//        List<TransactionCategory> categorizedTransactions = categoryRuleRunner.runTransactionCategorization(transactions);
//        Optional<SubBudget> subBudgetOptional = subBudgetService.findSubBudgetByUserIdAndDate(userId, date);
//        if(subBudgetOptional.isEmpty())
//        {
//            return false;
//        }
//        SubBudget subBudget = subBudgetOptional.get();
//        List<BudgetCategory> budgetCategories = budgetCategoryRunner.runBudgetCategoryProcessForDate(date, subBudget);
//        return !budgetCategories.isEmpty();
//    }
//
//    public boolean runRecurringTransactionImport(Long userId, LocalDate startDate, LocalDate endDate)
//    {
//        return false;
//    }
//}
