package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.CSVTransactionsByCategory;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.exceptions.DataException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
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

    public List<CSVTransactionsByCategory> getCSVTransactionsByCategoryList(final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            final String csvTransactionCategoryQuery = """
                    SELECT ct.id, ct.merchantName, tc.matchedCategory, ct.transactionDate, ct.transactionAmount,
                        ct.extendedDescription, ct.balance
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
            csvTransactionsByCategories = results.stream()
                    .map(result -> {
                        // Cast object parameters
                        Long csvId = (Long) result[0];
                        String merchantName = (String) result[1];
                        String matchedCategory = (String) result[2];
                        LocalDate transactionDate = (LocalDate) result[3];
                        BigDecimal transactionAmount = (BigDecimal) result[4];
                        String extendedDescription = (String) result[5];
                        BigDecimal balance = (BigDecimal) result[6];

                    })
        }catch(Exception e){
            log.error("There was an error converting the result set to csv transactions by category: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

//    private List<CSVTransactionsByCategory> createCSVTransactionsByCategoryList(final List<TransactionCSV> csvTransactions)
//    {
//        return csvTransactions.stream()
//                .collect(Collectors.groupingBy(tx -> tx.getCategory() != null ? tx.getCategory() : "Uncategorized"))
//                .entrySet().stream()
//                .map(entry -> {
//                    String category = entry.getKey();
//                    List<TransactionCSV> transactions = entry.getValue();
//                    BigDecimal totalSpending = transactions.stream()
//                            .map(TransactionCSV::getTransactionAmount)
//                            .reduce(BigDecimal.ZERO, BigDecimal::add);
//                    return new CSVTransactionsByCategory(category, totalSpending, transactions);
//                })
//                .sorted(Comparator.comparing(CSVTransactionsByCategory::getTotalCategorySpending))
//                .collect(Collectors.toList());
//    }

}
