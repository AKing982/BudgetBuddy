package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataAccessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Data
@Slf4j
public class TransactionsByCategoryQueries
{
    @PersistenceContext
    private EntityManager entityManager;
    private TransactionService transactionService;
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public TransactionsByCategoryQueries(EntityManager entityManager,
                                         TransactionCategoryService transactionCategoryService,
                                         TransactionService transactionService)
    {
        this.entityManager = entityManager;
        this.transactionCategoryService = transactionCategoryService;
        this.transactionService = transactionService;
    }

    private List<CategoryTransactionMapping> getCategoryTransactionMapping(List<Object[]> queryResults)
    {
        return queryResults.stream()
                .map(result -> new CategoryTransactionMapping(
                        (String) result[0],  // category
                        (String) result[1]   // transactionId
                ))
                .toList();
    }

//    private List<TransactionsByCategory> createTransactionsByCategoryList(List<CategoryTransactionMapping> categoryTransactionMappingList)
//    {
//        List<TransactionsByCategory> transactionsByCategoryList = new ArrayList<>();
//        List<Transaction> transactions = new ArrayList<>();
//        for(CategoryTransactionMapping categoryTransactionMapping : categoryTransactionMappingList)
//        {
//            String category = categoryTransactionMapping.getCategory();
//            String transactionId = categoryTransactionMapping.getTransactionId();
//            Optional<Transaction> transactionOptional = transactionService.findTransactionById(transactionId);
//            if(transactionOptional.isEmpty())
//            {
//                continue;
//            }
//            Transaction transaction = transactionOptional.get();
//            transactions.add(transaction);
//            TransactionsByCategory transactionsByCategory = new TransactionsByCategory(category, transactions);
//            transactionsByCategoryList.add(transactionsByCategory);
//        }
//        return transactionsByCategoryList;
//    }


    private List<TransactionsByCategory> createTransactionsByCategoryList(List<CategoryTransactionMapping> categoryTransactionMappingList)
    {
        Map<String, List<String>> categoryToTransactionIds = new LinkedHashMap<>();
        for(CategoryTransactionMapping mapping : categoryTransactionMappingList)
        {
            String category = mapping.getCategory() != null ? mapping.getCategory() : "Uncategorized";
            categoryToTransactionIds.computeIfAbsent(category, k -> new ArrayList<>()).add(mapping.getTransactionId());
        }

        List<TransactionsByCategory> transactionsByCategoryList = new ArrayList<>();
        for(Map.Entry<String, List<String>> entry : categoryToTransactionIds.entrySet())
        {
            String category = entry.getKey();
            List<Transaction> transactions = new ArrayList<>();
            for(String transactionId : entry.getValue())
            {
                transactionService.findTransactionById(transactionId).ifPresent(transactions::add);
            }
            transactionsByCategoryList.add(new TransactionsByCategory(category, transactions));
        }
        return transactionsByCategoryList;
    }

    public List<TransactionsByCategory> getTransactionsByCategoryListByDate(final Long userId, final LocalDate date)
    {
        final String transactionsByCategoryDateQuery = "SELECT tc.matchedCategory, tc.transaction.id " +
                "FROM TransactionCategoryEntity tc " +
                "INNER JOIN TransactionsEntity t ON tc.transaction.id = t.id " +
                "INNER JOIN AccountEntity a ON t.account.id = a.id " +
                "WHERE a.user.id = :userId " +
                "AND t.posted =:date AND (tc.isUpdated = FALSE AND tc.status = 'PROCESSED') OR (tc.isUpdated = TRUE AND tc.status = 'PROCESSED') ";
        try
        {
            List<Object[]> queryResults = entityManager.createQuery(transactionsByCategoryDateQuery, Object[].class)
                    .setParameter("userId", userId)
                    .setParameter("date", date)
                    .getResultList();
            List<CategoryTransactionMapping> categoryTransactionMappingList = getCategoryTransactionMapping(queryResults);
            return createTransactionsByCategoryList(categoryTransactionMappingList);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the transactions by category for date {}", date, e);
            return Collections.emptyList();
        }
    }

    public List<TransactionsByCategory> getExpenseTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        final String query = """
                SELECT tc.matchedCategory,
                ABS(SUM(t.amount)) totalSpending,
                tc.categoryLevel,
                tc.expenseType
            FROM TransactionCategoryEntity tc
            INNER JOIN TransactionsEntity t ON tc.transaction.id = t.id
            INNER JOIN AccountEntity a ON t.account.id = a.id
            WHERE a.user.id = :userId
            AND t.posted BETWEEN :startDate AND :endDate
            AND tc.matchedCategory NOT IN ('Uncategorized', 'Deposit', 'Income', 'Withdrawal')
            GROUP BY tc.matchedCategory, tc.categoryLevel, tc.expenseType, tc.subBudget.id
            """;
        try
        {
            List<Object[]> results = entityManager.createQuery(query, Object[].class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();
            return convertExpenseTransactionsByCategory(results);

        }catch(DataAccessException e){
            log.error("There was an error retrieving the transactions by category for startDate {} and endDate {}", startDate, endDate, e);
            return Collections.emptyList();
        }
    }

    private List<TransactionsByCategory> convertExpenseTransactionsByCategory(final List<Object[]> results)
    {
        if(results == null || results.isEmpty())
        {
            return Collections.emptyList();
        }
        return results.stream()
                .map(result -> {
                    String category = (String) result[0];
                    BigDecimal categorySpending = (BigDecimal) result[1];
                    CategoryPriorityLevel categoryPriorityLevel = result[2] != null
                            ? (CategoryPriorityLevel) result[2]
                            : CategoryPriorityLevel.LEVEL_5;
                    CategoryExpenseType categoryExpenseType = result[3] != null
                            ? (CategoryExpenseType) result[3]
                            : CategoryExpenseType.VARIABLE;
                    return TransactionsByCategory.builder()
                            .categoryExpenseType(categoryExpenseType)
                            .categoryName(category)
                            .priority(categoryPriorityLevel)
                            .totalCategorySpending(categorySpending)
                            .build();
                })
                .sorted(Comparator.comparing(TransactionsByCategory::getCategoryName))
                .toList();
    }

    public List<TransactionsByCategory> getProcessedTransactionsByCategoryListByDateRange(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        final String transactionsByCategoryDateRangeQuery = "SELECT tc.matchedCategory, tc.transaction.id " +
                "FROM TransactionCategoryEntity tc " +
                "INNER JOIN TransactionsEntity t ON tc.transaction.id = t.id " +
                "INNER JOIN AccountEntity a ON t.account.id = a.id " +
                "WHERE a.user.id = :userId " +
                "AND t.posted BETWEEN :startDate AND :endDate " +
                "AND tc.matchedCategory <> 'Uncategorized' AND tc.isUpdated = FALSE AND tc.status = 'PROCESSED'";
        try
        {
            List<Object[]> queryResults = entityManager.createQuery(transactionsByCategoryDateRangeQuery, Object[].class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();
            List<CategoryTransactionMapping> categoryTransactionMappingList = getCategoryTransactionMapping(queryResults);
            return createTransactionsByCategoryList(categoryTransactionMappingList);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the transactions by category for startDate {} and endDate {}", startDate, endDate, e);
            return Collections.emptyList();
        }
    }

    public List<TransactionsByCategory> getUpdatedTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            final String transactionsByCategoryQuery =
                    "SELECT tc.matchedCategory, t.id " +   // <-- space before closing quote
                            "FROM TransactionCategoryEntity tc " +
                            "INNER JOIN TransactionsEntity t ON tc.transaction.id = t.id " +
                            "INNER JOIN AccountEntity a ON t.account.id = a.id " +
                            "WHERE a.user.id = :userId " +
                            "AND t.posted BETWEEN :startDate AND :endDate " +
                            "AND tc.isUpdated = TRUE";
            List<Object[]> queryResults = entityManager.createQuery(transactionsByCategoryQuery, Object[].class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();
            if(queryResults.isEmpty())
            {
                return Collections.emptyList();
            }
            List<String> transactionIds = queryResults.stream()
                    .map(result -> (String) result[1])
                    .toList();
            List<CategoryTransactionMapping> categoryTransactionMappings = getCategoryTransactionMapping(queryResults);
            if(!categoryTransactionMappings.isEmpty())
            {
                updateTransactionCategoriesIsUpdatedToFalse(transactionIds);
            }
            return createTransactionsByCategoryList(categoryTransactionMappings);
        }catch(DataAccessException e){
            log.error("There was an error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private void updateTransactionCategoriesToProcessed(List<String> transactionIds)
    {
        if(transactionIds == null || transactionIds.isEmpty())
        {
            return;
        }
        try
        {
            transactionIds.forEach(transactionId -> {
                transactionCategoryService.updateTransactionCategoryStatus(transactionId, TransactionCategoryStatus.PROCESSED);
            });
        }catch(Exception e){
            log.error("There was an error updating the transaction categories to processed", e);
        }
    }

    private void updateTransactionCategoriesIsUpdatedToFalse(List<String> ids)
    {
        if(ids.isEmpty())
        {
            return;
        }
        try
        {
            ids.forEach(transactionId -> {
                transactionCategoryService.updateTransactionCategoryIsUpdated(transactionId, false);
            });
        }catch(DataAccessException e){
            log.error("There was an error updating the transaction categories isUpdated to false", e);
            return;
        }
    }

    public List<TransactionsByCategory> getTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        log.info("Fetching Plaid Transactions By Category query for start date: {} and end date: {}", startDate, endDate);
        final String transactionsByCategoryQuery =  "SELECT tc.matchedCategory, t.id " +
                "FROM TransactionCategoryEntity tc " +
                "INNER JOIN TransactionsEntity t ON tc.transaction.id = t.id " +
                "INNER JOIN AccountEntity a ON t.account.id = a.id " +
                "WHERE a.user.id = :userId " +
                "AND t.posted BETWEEN :startDate AND :endDate " +
                "AND ((tc.isUpdated = FALSE AND tc.status = 'NEW') OR (tc.isUpdated = TRUE AND tc.status = 'PROCESSED'))";
        try
        {
            List<Object[]> queryResults = entityManager.createQuery(transactionsByCategoryQuery, Object[].class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();
            if(queryResults.isEmpty())
            {
                return Collections.emptyList();
            }
            List<String> transactionIds = queryResults.stream()
                    .map(result -> (String) result[1])
                    .toList();
            List<CategoryTransactionMapping> categoryTransactionMappings = getCategoryTransactionMapping(queryResults);
            if(!categoryTransactionMappings.isEmpty())
            {
                updateTransactionCategoriesToProcessed(transactionIds);
            }
            List<TransactionsByCategory> transactionCategories = createTransactionsByCategoryList(categoryTransactionMappings);
            log.info("Transaction Categories size: {}", transactionCategories.size());
            return transactionCategories;
        }catch(DataAccessException e){
            log.error("There was an error fetching the query results for the transactions by category for startDate {} and endDate {}", startDate, endDate, e);
            return Collections.emptyList();
        }
    }


    public List<Transaction> getTransactionsByCategory(final String category, final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        final String categoryToTransactionIdQuery = "SELECT tc.matchedCategory, tc.transaction.id " +
                "FROM TransactionCategoryEntity tc " +
                "INNER JOIN TransactionsEntity t ON tc.transaction.id = t.id " +
                "INNER JOIN AccountEntity a ON t.account.id = a.id " +
                "WHERE a.user.id = :userId " +
                "AND t.posted BETWEEN :startDate AND :endDate AND tc.matchedCategory = :category";
        try
        {
            List<Object[]> queryResults = entityManager.createQuery(categoryToTransactionIdQuery, Object[].class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("category", category)
                    .getResultList();
            List<CategoryTransactionMapping> categoryTransactionMapping = getCategoryTransactionMapping(queryResults);
            if(categoryTransactionMapping.isEmpty())
            {
                return Collections.emptyList();
            }
            return getTransactionModelsByMapping(categoryTransactionMapping);
            // Next create the list of Transactions
        }catch(DataAccessException e){
            log.error("There was an error retrieving the transactions for category: {}", category, e);
            return Collections.emptyList();
        }
    }

    private List<Transaction> getTransactionModelsByMapping(List<CategoryTransactionMapping> categoryTransactionMapping)
    {
        List<Transaction> transactions = new ArrayList<>();
        for(CategoryTransactionMapping categoryTransactionMapping1 : categoryTransactionMapping)
        {
            String transactionId = categoryTransactionMapping1.getTransactionId();
            Optional<Transaction> transactionOptional = transactionService.findTransactionById(transactionId);
            if(transactionOptional.isEmpty())
            {
                continue;
            }
            Transaction transaction = transactionOptional.get();
            transactions.add(transaction);
        }
        return transactions;
    }

//    public BigDecimal getTotalSpendingByCategory(final String category, final Long userId, final LocalDate startDate, final LocalDate endDate)
//    {
//        if(category == null || userId == null || startDate == null || endDate == null)
//        {
//            return BigDecimal.ZERO;
//        }
//        try
//        {
//            final String jpql = "SELECT CASE " +
//                    "WHEN SUM(t.amount) < 0 THEN (-1) * SUM(t.amount) " +
//                    "ELSE SUM(t.amount) END " +
//                    "FROM TransactionCategoryEntity tc " +
//                    "INNER JOIN TransactionsEntity t ON tc.transactionId = t.transactionId " +
//                    "INNER JOIN AccountEntity a ON t.accountId = a.id " +
//                    "WHERE a.userId = :userId " +
//                    "AND t.posted BETWEEN :startDate AND :endDate " +
//                    "AND tc.matchedCategory = :category " +
//                    "GROUP BY tc.matchedCategory";
//            return entityManager.createQuery(jpql, BigDecimal.class)
//                    .setParameter("userId", userId)
//                    .setParameter("startDate", startDate)
//                    .setParameter("endDate", endDate)
//                    .setParameter("category", category)
//                    .getSingleResult();
//        }catch(DataAccessException e){
//            log.error("There was an error retrieving the total spending by category", e);
//            return BigDecimal.ZERO;
//        }
//    }
}
