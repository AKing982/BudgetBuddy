package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.exceptions.DataAccessException;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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

    private TransactionCSV convertObjectToCSV(Object[] result)
    {
        Long id = (Long) result[0];
        String merchantName = (String) result[1];
        BigDecimal transactionAmount = (BigDecimal) result[2];
        LocalDate transactionDate = (LocalDate) result[3];
        int suffix = (Integer) result[4];
        String accountName = (String) result[5];
        BigDecimal balance = (BigDecimal) result[6];

        return TransactionCSV.builder()
                .id(id)
                .merchantName(merchantName)
                .transactionAmount(transactionAmount)
                .transactionDate(transactionDate)
                .suffix(suffix)
                .account(accountName)
                .balance(balance)
                .build();
    }

    public Optional<TransactionCSV> getSingleTransactionCSVWithCategory(final Long csvId, final Long userId)
    {
        final String csvTransactionCategoryQuery = """
                SELECT cte.id, cte.merchantName, cte.transactionAmount, cte.transactionDate, cae.suffix, cae.accountName,
                cte.balance
                FROM TransactionCategoryEntity tc
                INNER JOIN CSVTransactionEntity cte
                    ON tc.csvTransaction.id = cte.id
                INNER JOIN CSVAccountEntity cae
                    ON cte.csvAccount.id = cae.id
                WHERE cte.id = :csvId AND cae.user.id = :userId
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

    public List<TransactionCSV> getTransactionCSVByCategoryList(final LocalDate startDate, final LocalDate endDate, final Long userID)
    {
        final String query = """
                SELECT cte.id, tc.matchedCategory, cte.merchantName, cte.description, cte.extendedDescription,
                cte.transactionAmount, cte.balance, cte.transactionDate, cae.suffix, cae.accountName
                FROM TransactionCategoryEntity tc
                INNER JOIN CSVTransactionEntity cte
                   ON tc.csvTransaction.id = cte.id
                INNER JOIN CSVAccountEntity cae
                   ON cte.csvAccount.id = cae.id
                WHERE cte.transactionDate BETWEEN :startDate AND :endDate
                AND cae.user.id =:userID
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
                        .category((String) result[1])
                        .transactionAmount((BigDecimal) result[5])
                        .transactionDate((LocalDate) result[7])
                        .balance((BigDecimal) result[6])
                        .account((String) result[9])
                        .merchantName((String) result[2])
                        .suffix((Integer) result[8])
                        .extendedDescription((String) result[4])
                        .id((Long) result[0])
                        .description((String) result[3])
                        .build())
                .collect(Collectors.toList());
    }
}
