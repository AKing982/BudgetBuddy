package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.CategoryDateInfo;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.workbench.Merchants;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Getter
@Setter
@Slf4j
public class BudgetCategoryQueries
{
    @PersistenceContext
    private EntityManager entityManager;
    private final List<String> merchantNames;
    private final String[] subscriptionCategoryIds = new String[]{
            "17018000", "18020004", "17000000", "19013000", "19019000", "18061000", "22009000"};
    private final String[] utilitiesMerchants = new String[]{"Enb Gas Ut", "Conservice LLC", "Pacific Power"};
    private final String[] gasMerchants = new String[]{"Maverik", "Chevron", "Sinclair"};
    private final String[] groceriesMerchants = new String[]{"Smith's", "Walmart", "Winco Foods", "Harmons"};
    private final String[] orderOutCategoryIds = new String[]{"13005000", "13005032"};
    private final String paypalDescription = "%PAYPAL INST XFER PAYPAL%";
    private final String categoryId = "16001000";
    private final String financeCategoryId = "18020004";
    private CategoryDateInfo categoryDateInfo;

    @Autowired
    public BudgetCategoryQueries(EntityManager entityManager)
    {
        this.entityManager = entityManager;
        this.merchantNames = Arrays.stream(Merchants.values())
                .map(Enum::name)
                .collect(Collectors.toList());
    }

    public void initializeCategoryDateInfo(CategoryDateInfo categoryDateInfo)
    {
        this.categoryDateInfo = categoryDateInfo;
    }

    public boolean userHasSubscriptions()
    {
        final String hasSubscriptionQuery = """
        SELECT CASE WHEN COUNT(t) > 0 THEN TRUE ELSE FALSE END
        FROM TransactionsEntity t
        JOIN t.account a
        WHERE a.user.id = :userId
          AND t.merchantName IN (:merchantNames)
          AND t.amount < :amountLimit
          AND t.category.id IN :categoryIds
          AND t.posted BETWEEN :startDate AND :endDate
    """;
        try
        {
            return entityManager.createQuery(hasSubscriptionQuery, Boolean.class)
                    .setParameter("userId", this.categoryDateInfo.getUserId())
                    .setParameter("merchantNames", merchantNames)
                    .setParameter("amountLimit", 100)
                    .setParameter("categoryIds", Arrays.asList(subscriptionCategoryIds))
                    .setParameter("startDate", this.categoryDateInfo.getStartDate())
                    .setParameter("endDate", this.categoryDateInfo.getEndDate())
                    .getSingleResult();
        } catch (DataAccessException e)
        {
            log.error("There was an error with running the query: ", e);
            return false;
        }
    }

    public boolean userHasPayments()
    {
        final String hasPaymentsQuery = """
                SELECT CASE WHEN COUNT(t) > 0 THEN TRUE ELSE FALSE END
                FROM TransactionsEntity t
                JOIN t.account a
                WHERE (t.merchantName IN ('Affirm') OR t.category.id =:categoryId
                OR t.description LIKE :description) AND (t.posted BETWEEN :startDate AND :endDate)
                AND a.user.id = :userId
                """;
        try {
            return entityManager.createQuery(hasPaymentsQuery, Boolean.class)
                    .setParameter("userId", this.categoryDateInfo.getUserId())
                    .setParameter("description", paypalDescription)
                    .setParameter("startDate", this.categoryDateInfo.getStartDate())
                    .setParameter("endDate", this.categoryDateInfo.getEndDate())
                    .setParameter("categoryId", categoryId)
                    .getSingleResult();
        } catch (DataAccessException e) {
            log.error("There was an error query for user payments: ", e);
            return false;
        }
    }

    public double getCategoryAmount(Long userId, LocalDate startDate, LocalDate endDate, String category)
    {
        switch(category)
        {
            case "Rent":
                return getRentTotal(userId, startDate, endDate).doubleValue();
            case "Insurance":
                return getInsuranceTotal(userId, startDate, endDate).doubleValue();
            case "Subscriptions":
                return getSubscriptionTotal(userId, startDate, endDate).doubleValue();
            case "Utilities":
                return getUtilitiesSpendingTotal(userId, startDate, endDate).doubleValue();
            default: throw new RuntimeException("Invalid category: " + category);
        }
    }

    public boolean userHasRent()
    {
        final String rentFirstHalfQuery = """
                SELECT CASE WHEN COUNT(t) > 0 THEN TRUE ELSE FALSE END
                FROM TransactionsEntity t
                JOIN t.account a
                JOIN t.category c
                WHERE (c.id =:categoryId OR t.merchantName IN ('Flex Finance'))
                AND t.amount > 100 AND t.posted BETWEEN :startDate AND :endDate AND a.user.id = :userId
                """;
        try {
            return entityManager.createQuery(rentFirstHalfQuery, Boolean.class)
                    .setParameter("userId", this.categoryDateInfo.getUserId())
                    .setParameter("categoryId", financeCategoryId)
                    .setParameter("startDate", this.categoryDateInfo.getStartDate())
                    .setParameter("endDate", this.categoryDateInfo.getEndDate())
                    .getSingleResult();
        } catch (DataAccessException e) {
            log.error("There was an error query for user rent: ", e);
            return false;
        }
    }

    public BigDecimal getSubscriptionTotal(Long userId, LocalDate startDate, LocalDate endDate) {
        return null;
    }

    public BigDecimal getPaymentTotal(Long userId, LocalDate startDate, LocalDate endDate)
    {
        final String paymentSpendingQuery = """
                 SELECT SUM(t.amount)
                 FROM TransactionsEntity t
                 JOIN t.account a
                 WHERE (t.merchantName IN ('Affirm') OR t.category.id =:categoryId
                 OR t.description LIKE :description) AND (t.posted BETWEEN :startDate AND :endDate)
                 AND a.user.id = :userId
                """;
        try
        {
            BigDecimal paymentTotal = getSpendingTotalResult(paymentSpendingQuery, userId, startDate, endDate, categoryId, paypalDescription);
            if (paymentTotal.compareTo(BigDecimal.ZERO) < 0 || paymentTotal.compareTo(BigDecimal.ZERO) == 0)
            {
                return BigDecimal.ZERO;
            }
            return paymentTotal;
        } catch (DataAccessException e) {
            log.error("There was an error with running the query: ", e);
            return BigDecimal.ZERO;
        }
    }

    private BigDecimal getSpendingTotalResult(final String query, Long userId, LocalDate startDate, LocalDate endDate, String categoryId, String description) {
        return entityManager.createQuery(query, BigDecimal.class)
                .setParameter("userId", userId)
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .setParameter("categoryId", categoryId)
                .setParameter("description", paypalDescription)
                .getSingleResult();
    }

    public BigDecimal getRentTotal(final Long userId, final LocalDate startDate, final LocalDate endDate) {
        final String rentQuery = """
                SELECT SUM(t.amount)
                FROM TransactionsEntity t
                JOIN t.account a
                JOIN t.category c
                WHERE (c.id =:categoryId OR t.merchantName IN ('Flex Finance'))
                AND t.amount > 100 AND a.user.id = :userId
                AND t.posted BETWEEN :startDate AND :endDate
                """;
        try
        {
            BigDecimal rentTotal = entityManager.createQuery(rentQuery, BigDecimal.class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("categoryId", "18020004")
                    .getSingleResult();
            return Objects.requireNonNullElse(rentTotal, BigDecimal.ZERO);
        } catch (DataAccessException e) {
            log.error("There was an error with running the query: ", e);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal getInsuranceTotal(Long userId, LocalDate startDate, LocalDate endDate)
    {
        final String insuranceQuery = """
                SELECT SUM(t.amount)
                FROM TransactionsEntity t
                JOIN t.account a
                JOIN t.category c
                WHERE (c.id =:categoryId OR c.name =:name)
                AND a.user.id = :userId
                AND t.posted BETWEEN :startDate AND :endDate
                """;
        try
        {
            BigDecimal insuranceTotal = entityManager.createQuery(insuranceQuery, BigDecimal.class)
                    .setParameter("userId", userId)
                    .setParameter("categoryId", "18030000")
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("name", "Insurance")
                    .getSingleResult();
            return Objects.requireNonNullElse(insuranceTotal, BigDecimal.ZERO);
        } catch (DataAccessException e) {
            log.error("There was an error retrieving the insurance total spending: ", e);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal getUtilitiesSpendingTotal(Long userId, LocalDate startDate, LocalDate endDate)
    {
        final String utilitiesSpendingQuery = """
                SELECT SUM(t.amount)
                FROM TransactionsEntity t
                JOIN t.account a
                JOIN t.category c
                WHERE (c.name =:name OR t.merchantName IN (:utilMerchants))
                AND a.user.id = :userId
                AND t.posted BETWEEN :startDate AND :endDate
                """;
        try
        {
            List<String> utilMerchantsList = Arrays.asList(utilitiesMerchants);
            BigDecimal utilitiesTotal = entityManager.createQuery(utilitiesSpendingQuery, BigDecimal.class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("name", "Utilities")
                    .setParameter("utilMerchants", utilMerchantsList)
                    .getSingleResult();
            return Objects.requireNonNullElse(utilitiesTotal, BigDecimal.ZERO);

        } catch (DataAccessException e) {
            log.error("There was an error with running the query: ", e);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal getGasSpendingTotal(Long userId, LocalDate startDate, LocalDate endDate)
    {
        final String gasFuelSpendingQuery = """
                SELECT SUM(t.amount)
                FROM TransactionsEntity t
                JOIN t.account a
                JOIN t.category c
                WHERE (c.name =:name OR t.merchantName IN (:gasMerchants))
                AND a.user.id = :userId
                AND t.posted BETWEEN :startDate AND :endDate
                """;
        try {
            BigDecimal gasTotal = entityManager.createQuery(gasFuelSpendingQuery, BigDecimal.class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("name", "Gas Stations")
                    .setParameter("gasMerchants", gasMerchants)
                    .getSingleResult();
            return Objects.requireNonNullElse(gasTotal, BigDecimal.ZERO);
        } catch (DataAccessException e) {
            log.error("There was an error with running the query: ", e);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal getOrderOutTotal(Long userId, LocalDate startDate, LocalDate endDate)
    {
        final String orderOutSpendingQuery = """
                SELECT SUM(t.amount)
                FROM TransactionsEntity t
                JOIN t.account a
                JOIN t.category c
                WHERE (c.id IN (:orderOutCatIds) OR c.name =:name) AND (t.posted BETWEEN :startDate AND :endDate)
                AND a.user.id = :userId
                """;
        try
        {
            return entityManager.createQuery(orderOutSpendingQuery, BigDecimal.class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("name", "Restaurants")
                    .setParameter("orderOutCatIds", orderOutCategoryIds)
                    .getSingleResult();
        } catch (DataAccessException e)
        {
            log.error("There was an error with running the query: ", e);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal getGroceriesSpendingTotal(Long userId, LocalDate startDate, LocalDate endDate)
    {
        final String groceriesSpendingQuery = """
                SELECT SUM(t.amount)
                FROM TransactionsEntity t
                JOIN t.account a
                JOIN t.category c
                WHERE (t.merchantName IN (:groceriesMerchants) OR c.name =:name)
                AND (t.posted BETWEEN :startDate AND :endDate)
                AND a.user.id = :userId
                """;
        try
        {
            return entityManager.createQuery(groceriesSpendingQuery, BigDecimal.class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("name", "Supermarkets and Groceries")
                    .setParameter("groceriesMerchants", groceriesMerchants)
                    .getSingleResult();
        } catch (DataAccessException e) {
            log.error("There was an error with running the query: ", e);
            return BigDecimal.ZERO;
        }
    }

    public BigDecimal getRentAmount(Long userId, LocalDate startDate, LocalDate endDate)
    {
        final String rentQuery = """
              
              SELECT t.amount
              FROM TransactionsEntity t
              JOIN t.account a
              JOIN t.category c
              WHERE (c.id =:rentCategoryId OR t.merchantName IN ('Flex Finance'))
              AND t.amount > 100
              AND t.posted BETWEEN :startDate AND :endDate
              AND a.user.id = :userId
              """;
        try
        {
            return entityManager.createQuery(rentQuery, BigDecimal.class)
                    .setParameter("userId", userId)
                    .setParameter("rentCategoryId", "18020004")
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getSingleResult();
        }catch(DataAccessException e)
        {
            log.error("There was an error with running the query: ", e);
            return BigDecimal.ZERO;
        }
    }

}
