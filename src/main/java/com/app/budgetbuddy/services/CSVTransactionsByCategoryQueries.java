package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.CategorySpendAmount;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.exceptions.DataException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CSVTransactionsByCategoryQueries
{
    @PersistenceContext
    private EntityManager entityManager;
    private CSVTransactionService csvTransactionService;

    @Autowired
    public CSVTransactionsByCategoryQueries(CSVTransactionService csvTransactionService,
                                            EntityManager entityManager)
    {
        this.csvTransactionService = csvTransactionService;
        this.entityManager = entityManager;
    }

    public List<CategorySpendAmount> getTotalMatchedCategorySpending(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            final String query = """
                    SELECT tc.matchedCategory,
                    ABS(SUM(ct.transactionAmount)) as totalSpending
                    FROM TransactionCategoryEntity tc
                    INNER JOIN CSVTransactionEntity ct 
                        ON tc.csvTransaction.id = ct.id
                    INNER JOIN CSVAccountEntity ca
                        ON ct.csvAccount.id = ca.id
                    WHERE ct.transactionDate BETWEEN :startDate AND :endDate
                        AND ca.user.id = :userId
                    GROUP BY tc.matchedCategory
                    """;
            List<Object[]> result = entityManager.createQuery(query, Object[].class)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("userId", userId)
                    .getResultList();

            if(result == null)
            {
                return Collections.emptyList();
            }
            return convertObjectToCategorySpending(result);

        }catch(DataException e){
            log.error("There was an error fetching the total category spending: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<CategorySpendAmount> convertObjectToCategorySpending(final List<Object[]> results)
    {
        return results.stream()
                .map(result -> {
                    String category = (String) result[0];
                    BigDecimal amount = (BigDecimal) result[1];
                    return new CategorySpendAmount(category, amount);
                })
                .collect(Collectors.toList());
    }

    public List<CSVTransactionsByCategory> getCSVTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            final String csvTransactionCategoryQuery = """
                    SELECT ct.id, tc.matchedCategory
                    FROM TransactionCategoryEntity tc
                    INNER JOIN CSVTransactionEntity ct
                        ON tc.csvTransaction.id = ct.id
                    INNER JOIN CSVAccountEntity cae
                        ON ct.csvAccount.id = cae.id
                    WHERE ct.transactionDate BETWEEN :startDate AND :endDate
                        AND cae.user.id =:userId
                    """;
            List<Object[]> results = entityManager.createQuery(csvTransactionCategoryQuery, Object[].class)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("userId", userId)
                    .getResultList();
            return createCSVTransactionsByCategoryList(results);

        }catch(DataException e){
            log.error("There was an error fetching the csv transactions by category list for start={} and end={}: {}", startDate, endDate, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<CSVTransactionsByCategory> createCSVTransactionsByCategoryList(final List<Object[]> results)
    {
        if(results.isEmpty())
        {
            return Collections.emptyList();
        }
        List<CSVTransactionsByCategory> csvTransactionsByCategories = new ArrayList<>();
        try
        {
            Map<String, List<Long>> categoryToTransactionIds = new HashMap<>();
            for(Object[] result : results)
            {
                Long transactionId = (Long) result[0];
                String category = (String) result[1];
                categoryToTransactionIds.computeIfAbsent(category != null ? category : "Uncategorized", k -> new ArrayList<>()).add(transactionId);
            }
            for(Map.Entry<String, List<Long>> entry : categoryToTransactionIds.entrySet())
            {
                String category = entry.getKey();
                List<Long> transactionIds = entry.getValue();
                List<TransactionCSV> transactionCSVList = new ArrayList<>();
                for(Long transactionId : transactionIds)
                {
                    Optional<TransactionCSV> transactionCSVOptional = csvTransactionService.findTransactionCSVById(transactionId);
                    if(transactionCSVOptional.isEmpty())
                    {
                        log.info("No CSV Transaction found with id {}", transactionId);
                        continue;
                    }
                    TransactionCSV transactionCSV = transactionCSVOptional.get();
                    transactionCSVList.add(transactionCSV);
                }
                BigDecimal totalCategorySpending = transactionCSVList.stream()
                        .map(TransactionCSV::getTransactionAmount)
                        .map(BigDecimal::abs)
                        .reduce(BigDecimal.ZERO, BigDecimal::add);

                csvTransactionsByCategories.add(new CSVTransactionsByCategory(category, totalCategorySpending, transactionCSVList));
            }
            csvTransactionsByCategories.sort(Comparator.comparing(CSVTransactionsByCategory::getTotalCategorySpending));
            return csvTransactionsByCategories;
        }catch(Exception e){
            log.error("There was an error converting the result set to csv transactions by category: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
