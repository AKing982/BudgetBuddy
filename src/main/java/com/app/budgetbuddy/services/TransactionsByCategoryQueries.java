package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CategoryTransactionMapping;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionsByCategory;
import com.app.budgetbuddy.exceptions.DataAccessException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Data
@Slf4j
public class TransactionsByCategoryQueries
{
    @PersistenceContext
    private EntityManager entityManager;
    private TransactionService transactionService;

    @Autowired
    public TransactionsByCategoryQueries(EntityManager entityManager,
                                         TransactionService transactionService)
    {
        this.entityManager = entityManager;
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


    private List<TransactionsByCategory> createTransactionsByCategoryList(List<CategoryTransactionMapping> categoryTransactionMappingList)
    {
        List<TransactionsByCategory> transactionsByCategoryList = new ArrayList<>();
        List<Transaction> transactions = new ArrayList<>();
        for(CategoryTransactionMapping categoryTransactionMapping : categoryTransactionMappingList)
        {
            String category = categoryTransactionMapping.getCategory();
            String transactionId = categoryTransactionMapping.getTransactionId();
            Optional<Transaction> transactionOptional = transactionService.findTransactionById(transactionId);
            if(transactionOptional.isEmpty())
            {
                continue;
            }
            Transaction transaction = transactionOptional.get();
            transactions.add(transaction);
            TransactionsByCategory transactionsByCategory = new TransactionsByCategory(category, transactions);
            transactionsByCategoryList.add(transactionsByCategory);
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
                "AND t.posted =:date";
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

    public List<TransactionsByCategory> getTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        final String transactionsByCategoryQuery =  "SELECT tc.matchedCategory, tc.transaction.id " +
                "FROM TransactionCategoryEntity tc " +
                "INNER JOIN TransactionsEntity t ON tc.transaction.id = t.id " +
                "INNER JOIN AccountEntity a ON t.account.id = a.id " +
                "WHERE a.user.id = :userId " +
                "AND t.posted BETWEEN :startDate AND :endDate " +
                "UNION " +
                "SELECT tc.matchedCategory, cte.id " +
                "FROM TransactionCategoryEntity tc " +
                "INNER JOIN CSVTransactionEntity cte " +
                " ON tc.csvTransaction.id = cte.id " +
                "INNER JOIN CSVAccountEntity cae " +
                " ON cte.csvAccount.id = cae.id " +
                "WHERE cte.transactionDate BETWEEN :startDate AND :endDate " +
                "AND cae.user.id = :userId";
        try
        {
            List<Object[]> queryResults = entityManager.createQuery(transactionsByCategoryQuery, Object[].class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();
            List<CategoryTransactionMapping> categoryTransactionMappings = getCategoryTransactionMapping(queryResults);
            return createTransactionsByCategoryList(categoryTransactionMappings);
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
