package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.CategorySpendAmount;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.TransactionCategoryStatus;
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
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public CSVTransactionsByCategoryQueries(CSVTransactionService csvTransactionService,
                                            TransactionCategoryService transactionCategoryService,
                                            EntityManager entityManager)
    {
        this.csvTransactionService = csvTransactionService;
        this.transactionCategoryService = transactionCategoryService;
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

    public List<CSVTransactionsByCategory> getUpdatedCSVTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
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
                        AND cae.user.id =:userId AND tc.isUpdated = TRUE
                        """;
            List<Object[]> results = entityManager.createQuery(csvTransactionCategoryQuery, Object[].class)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("userId", userId)
                    .getResultList();
            log.info("Updated Results size: {}", results.size());
            if(results.isEmpty())
            {
                return Collections.emptyList();
            }
            List<Long> csvIds = results.stream()
                    .map(result -> (Long) result[0])
                    .toList();
            List<CSVTransactionsByCategory> csvTransactionsByCategoryList = createCSVTransactionsByCategoryList(results);
            if(!csvTransactionsByCategoryList.isEmpty())
            {
                updateTransactionCategoriesIsUpdatedToFalse(csvIds);
            }
            return csvTransactionsByCategoryList;
        }catch(DataException e){
            log.error("There was an error: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    public List<CSVTransactionsByCategory> getCSVTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            log.info("Fetching new CSV Transactions by Category Query for start date: {} and end date: {}", startDate, endDate);
            final String csvTransactionCategoryQuery = """
                    SELECT ct.id, tc.matchedCategory
                    FROM TransactionCategoryEntity tc
                    INNER JOIN CSVTransactionEntity ct
                        ON tc.csvTransaction.id = ct.id
                    INNER JOIN CSVAccountEntity cae
                        ON ct.csvAccount.id = cae.id
                    WHERE ct.transactionDate BETWEEN :startDate AND :endDate
                        AND cae.user.id =:userId AND (tc.isUpdated = FALSE AND tc.status = 'NEW') OR (tc.isUpdated = true AND tc.status = 'PROCESSED')
                    """;
            List<Object[]> results = entityManager.createQuery(csvTransactionCategoryQuery, Object[].class)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("userId", userId)
                    .getResultList();
            log.info("Results size: {}", results.size());
            if(results.isEmpty())
            {
                return Collections.emptyList();
            }
            List<Long> csvIds = results.stream()
                    .map(result -> (Long) result[0])
                    .toList();
            List<CSVTransactionsByCategory> csvTransactionsByCategoryList = createCSVTransactionsByCategoryList(results);
            if(!csvTransactionsByCategoryList.isEmpty())
            {
                updateTransactionCategoriesToProcessed(csvIds);
            }
            return csvTransactionsByCategoryList;

        }catch(DataException e){
            log.error("There was an error fetching the csv transactions by category list for start={} and end={}: {}", startDate, endDate, e.getMessage());
            return Collections.emptyList();
        }
    }

    private void updateTransactionCategoriesIsUpdatedToFalse(List<Long> csvIds)
    {
        if(csvIds.isEmpty())
        {
            return;
        }
        try
        {
            for(Long csvId : csvIds)
            {
                transactionCategoryService.updateTransactionCategoryIsUpdated(csvId, false);
            }
        }catch(DataException e){
            log.error(e.getMessage());
        }
    }

    private void updateTransactionCategoriesToProcessed(List<Long> csvTransactionIds)
    {
        if(csvTransactionIds == null || csvTransactionIds.isEmpty())
        {
            return;
        }
        try
        {
            for(Long csvId : csvTransactionIds)
            {
                transactionCategoryService.updateTransactionCategoryStatus(
                        TransactionCategoryStatus.PROCESSED,
                        csvId
                );
            }
            log.info("Updated {} transaction categories to IsProcessed status", csvTransactionIds.size());
        } catch (Exception e) {
            log.error("Error updating transaction categories to IsProcessed: {}", e.getMessage(), e);
            // Don't throw - we still want to return the results even if update fails
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
