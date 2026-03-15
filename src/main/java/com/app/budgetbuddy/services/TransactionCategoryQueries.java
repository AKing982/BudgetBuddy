package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.exceptions.DataAccessException;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cglib.core.Local;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionCategoryQueries
{
    private final TransactionCategoryService transactionCategoryService;
    private EntityManager em;

    @Autowired
    public TransactionCategoryQueries(TransactionCategoryService transactionCategoryService,
                                      EntityManager em)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.em = em;
    }

    private Transaction convertObjectToTransaction(Object[] result)
    {
        String id = (String) result[0];
        String merchantName = (String) result[1];
        BigDecimal transactionAmount = (BigDecimal) result[2];
        LocalDate posted = (LocalDate) result[3];
        String description = (String) result[4];
        return Transaction.builder()
                .transactionId(id)
                .merchantName(merchantName)
                .amount(transactionAmount)
                .posted(posted)
                .description(description)
                .build();

    }

    private TransactionCSV convertObjectToCSV(Object[] result)
    {
        Long id = (Long) result[0];
        String merchantName = (String) result[1];
        BigDecimal transactionAmount = (BigDecimal) result[2];
        LocalDate transactionDate = (LocalDate) result[3];
        BigDecimal balance = (BigDecimal) result[4];
        String description = (String) result[5];
        String institutionId = (String) result[6];

        return TransactionCSV.builder()
                .id(id)
                .merchantName(merchantName)
                .transactionAmount(transactionAmount)
                .transactionDate(transactionDate)
                .balance(balance)
                .description(description)
                .institution_id(institutionId)
                .build();
    }

    public Optional<Transaction> getSingleTransactionWithCategory(final String transactionId, Long userId)
    {
        final String transactionCategoryQuery = """
                SELECT t.id, t.merchantName, t.amount, t.posted,
                t.description
                FROM TransactionCategoryEntity tc
                INNER JOIN TransactionsEntity t
                    ON tc.transaction.id = t.id
                WHERE t.id = :transactionId AND t.account.user.id = :userId
                """;
        try
        {
            Object[] result = em.createQuery(transactionCategoryQuery, Object[].class)
                    .setParameter("transactionId", transactionId)
                    .setParameter("userId", userId)
                    .getSingleResult();
            return Optional.of(convertObjectToTransaction(result));
        }catch(DataAccessException ex){
            log.error("There was an error fetching the transaction list by category {}: ", ex.getMessage());
            return Optional.empty();
        }
    }

    public Optional<TransactionCSV> getSingleTransactionCSVWithCategory(final Long csvId, final Long userId)
    {
        final String csvTransactionCategoryQuery = """
                SELECT cte.id, cte.merchantName, cte.transactionAmount, cte.transactionDate,
                cte.balance, cte.description, cte.institutionId
                FROM TransactionCategoryEntity tc
                INNER JOIN CSVTransactionEntity cte
                    ON tc.csvTransaction.id = cte.id
                WHERE cte.id = :csvId AND cte.user.id = :userId
                """;
        try
        {
            Object[] result = em.createQuery(csvTransactionCategoryQuery, Object[].class)
                    .setParameter("csvId", csvId)
                    .setParameter("userId", userId)
                    .getSingleResult();
            return Optional.of(convertObjectToCSV(result));
        }catch(DataAccessException ex){
            log.error("There was an error fetching the transaction csv list by category {}: ", ex.getMessage());
            return Optional.empty();
        }
    }

    public List<Transaction> getTransactionsByCategoryList(final Long userId, LocalDate startDate, LocalDate endDate)
    {
        final String query = """
                SELECT t.id, cte.matchedCategory, t.amount, t.merchantName, t.description, t.posted, t.logoUrl
                FROM TransactionCategoryEntity cte
                INNER JOIN TransactionsEntity t
                    ON cte.transaction.id = t.id
                INNER JOIN AccountEntity a
                    ON t.account.id = a.id
                WHERE cte.transaction.posted BETWEEN :startDate AND :endDate AND a.user.id = :userId
                """;
        try
        {
            List<Object[]> queryResults = em.createQuery(query, Object[].class)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("userId", userId)
                    .getResultList();
            return getTransactionMapping(queryResults);

        }catch(DataAccessException ex){
            log.error("There was an error fetching the transaction csv list by category {}: ", ex.getMessage());
            return Collections.emptyList();
        }
    }

    private List<Transaction> getTransactionMapping(List<Object[]> queryResults)
    {
        return queryResults.stream()
                .map(result -> Transaction.builder()
                        .transactionId((String) result[0])
                        .category((String) result[1])
                        .amount((BigDecimal) result[2])
                        .merchantName((String) result[3])
                        .description((String) result[4])
                        .posted((LocalDate) result[5])
                        .logoUrl((String) result[6])
                        .build())
                .collect(Collectors.toList());
    }

    public List<TransactionCSV> getTransactionCSVByCategoryList(final LocalDate startDate, final LocalDate endDate, final Long userID)
    {
        final String query = """
                SELECT cte.id, tc.matchedCategory, cte.merchantName, cte.description, cte.extendedDescription,
                cte.transactionAmount, cte.balance, cte.transactionDate
                FROM TransactionCategoryEntity tc
                INNER JOIN CSVTransactionEntity cte
                   ON tc.csvTransaction.id = cte.id
                WHERE cte.transactionDate BETWEEN :startDate AND :endDate
                AND cte.user.id =:userID
                """;
        try
        {
            List<Object[]> queryResults = em.createQuery(query, Object[].class)
                    .setParameter("userID", userID)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();
            return getTransactionCSVMapping(queryResults);
        }catch(DataAccessException ex){
            log.error("There was an error fetching the transaction csv list by category {}: ", ex.getMessage());
            return Collections.emptyList();
        }
    }


    private List<TransactionCSV> getTransactionCSVMapping(List<Object[]> queryResults)
    {
        return queryResults.stream()
                .map(result -> TransactionCSV.builder()
                        .id((Long) result[0])
                        .category((String) result[1])
                        .merchantName((String) result[2])
                        .description((String) result[3])
                        .extendedDescription((String) result[4])
                        .transactionAmount((BigDecimal) result[5])
                        .balance((BigDecimal) result[6])
                        .transactionDate((LocalDate) result[7])
                        // suffix and account removed - not in query
                        .build())
                .collect(Collectors.toList());
    }
}
