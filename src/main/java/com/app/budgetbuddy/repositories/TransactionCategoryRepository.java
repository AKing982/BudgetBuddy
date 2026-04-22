package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.domain.BudgetCategorySpending;
import com.app.budgetbuddy.domain.CategoryExpenseType;
import com.app.budgetbuddy.domain.CategoryPriorityLevel;
import com.app.budgetbuddy.domain.TransactionCategoryStatus;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionCategoryRepository extends JpaRepository<TransactionCategoryEntity, Long>
{
    @Query("SELECT tc FROM TransactionCategoryEntity tc WHERE tc.categorized_date BETWEEN :start AND :end AND tc.transaction.account.user.id =:uId")
    List<TransactionCategoryEntity> findTransactionCategoriesBetweenStartAndEndDates(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("uId") Long uId);

    @Query("SELECT tc FROM TransactionCategoryEntity tc WHERE tc.id =:id AND tc.categorized_date BETWEEN :start AND :end")
    List<TransactionCategoryEntity> findTransactionCategoryByStartAndEndDates(@Param("start") Long start, @Param("end") Long end, @Param("id") String transactionId);

    @Query("SELECT tc FROM TransactionCategoryEntity tc " +
            "JOIN tc.transaction t " +
            "WHERE t.id IN :transactionIds " +
            "ORDER BY tc.id")
    List<TransactionCategoryEntity> findTransactionCategoryByTransactionIds(@Param("transactionIds") List<String> transactionIds);


    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.isUpdated =:isUpdated WHERE tce.csvTransaction.id =:csvId")
    void updateCSVTransactionCategoryIsUpdated(@Param("csvId") Long csvId, @Param("isUpdated") boolean isUpdated);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.isUpdated =:updated WHERE tce.transaction.id =:id")
    void updateTransactionCategoryUpdated(@Param("id") String id, @Param("updated") boolean isUpdated);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.status =:status WHERE tce.csvTransaction.id =:csvId")
    void updateCSVTransactionCategoryStatus(@Param("csvId") Long csvId, @Param("status") TransactionCategoryStatus status);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.status =:status WHERE tce.transaction.id =:id")
    void updateTransactionCategoryStatus(@Param("id") String id, @Param("status") TransactionCategoryStatus status);

    @Query("SELECT t.posted FROM TransactionCategoryEntity tc " +
            "INNER JOIN tc.transaction t " +
            "WHERE tc.matchedCategory = 'Income' " +
            "AND t.account.user.id = :userId " +
            "AND tc.subBudget.id = :id " +
            "UNION " +
            "SELECT csv.transactionDate FROM TransactionCategoryEntity tc2 " +
            "INNER JOIN tc2.csvTransaction csv " +
            "WHERE tc2.matchedCategory = 'Income' " +
            "AND csv.user.id = :userId " +
            "AND tc2.subBudget.id = :id " +
            "ORDER BY 1 ASC")
    List<LocalDate> findIncomePostedDate(@Param("userId") Long userId, @Param("id") Long subBudgetId);


    @Query("""
        SELECT CAST(SUM(t.amount) AS double)
        FROM TransactionCategoryEntity tc
        INNER JOIN tc.transaction t
        WHERE t.posted >= :start
        AND t.posted <= :end
        AND t.account.user.id = :userId
        AND tc.matchedCategory IN ('Income', 'Deposit', 'Refund')
        """)
    Double findTransactionIncomeTotalByDateRangeAndUserId(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("userId") Long userId
    );

    @Query("""
        SELECT CAST(SUM(csv.transactionAmount) AS double)
        FROM TransactionCategoryEntity tc
        INNER JOIN tc.csvTransaction csv
        WHERE csv.transactionDate >= :start
        AND csv.transactionDate <= :end
        AND csv.user.id = :userId
        AND tc.matchedCategory IN ('Income', 'Deposit', 'Refund')
        """)
    Double findCSVIncomeTotalByDateRangeAndUserId(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("userId") Long userId
    );


    @Query("""
        SELECT CAST(ABS(SUM(t.amount)) AS double)
        FROM TransactionCategoryEntity tc
        INNER JOIN tc.transaction t
        WHERE t.posted >= :start
        AND t.posted <= :end
        AND t.account.user.id = :userId
        AND tc.matchedCategory NOT IN ('Income', 'Deposit', 'Uncategorized', 'Refund')
        """)
    Double findTransactionExpenseTotalByDateRangeAndUserId(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("userId") Long userId
    );

    @Query("""
        SELECT CAST(ABS(SUM(csv.transactionAmount)) AS double)
        FROM TransactionCategoryEntity tc
        INNER JOIN tc.csvTransaction csv
        WHERE csv.transactionDate >= :start
        AND csv.transactionDate <= :end
        AND csv.user.id = :userId
        AND tc.matchedCategory NOT IN ('Income', 'Deposit', 'Uncategorized', 'Refund')
        """)
    Double findCSVExpenseTotalByDateRangeAndUserId(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("userId") Long userId
    );


    @Query("""
        SELECT new com.app.budgetbuddy.domain.BudgetCategorySpending(
            tc.matchedCategory,
            CAST(ABS(SUM(t.amount)) AS double),
            CAST(0.0 AS double),
            MIN(t.posted),
            MAX(t.posted))
        FROM TransactionCategoryEntity tc
        INNER JOIN tc.transaction t
        WHERE t.posted >= :start
        AND t.posted <= :end
        AND t.account.user.id = :userId
        AND tc.matchedCategory NOT IN ('Income', 'Deposit', 'Uncategorized')
        GROUP BY tc.matchedCategory
        UNION
        SELECT new com.app.budgetbuddy.domain.BudgetCategorySpending(
            tc2.matchedCategory,
            CAST(ABS(SUM(csv.transactionAmount)) AS double),
            CAST(0.0 AS double),
            MIN(csv.transactionDate),
            MAX(csv.transactionDate))
        FROM TransactionCategoryEntity tc2
        INNER JOIN tc2.csvTransaction csv
        WHERE csv.transactionDate >= :start
        AND csv.transactionDate <= :end
        AND csv.user.id = :userId
        AND tc2.matchedCategory NOT IN ('Income', 'Deposit', 'Uncategorized')
        GROUP BY tc2.matchedCategory
        """)
    List<BudgetCategorySpending> findSpendingByDateRangeAndUserId(
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("userId") Long userId
    );

    @Query("SELECT t.posted FROM TransactionCategoryEntity tc " +
            "INNER JOIN tc.transaction t " +
            "WHERE tc.matchedCategory = 'Income' " +
            "AND t.account.user.id = :userId " +
            "AND tc.subBudget.id = :id AND tc.transaction.posted BETWEEN :start AND :end " +
            "UNION " +
            "SELECT csv.transactionDate FROM TransactionCategoryEntity tc2 " +
            "INNER JOIN tc2.csvTransaction csv " +
            "WHERE tc2.matchedCategory = 'Income' " +
            "AND csv.user.id = :userId " +
            "AND tc2.subBudget.id = :id AND tc2.csvTransaction.transactionDate BETWEEN :start AND :end " +
            "ORDER BY 1 ASC")
    List<LocalDate> findIncomePostedDateByDateShift(@Param("userId") Long userId, @Param("id") Long subBudgetId, @Param("start") LocalDate start, @Param("end") LocalDate end);


    boolean existsByCsvTransactionId(Long csvTransactionId);

    @Query("SELECT tce FROM TransactionCategoryEntity tce " +
           "JOIN tce.transaction t " +
           "WHERE t.account.user.id =:userId " +
           "AND t.posted BETWEEN :startDate AND :endDate " +
           "AND tce.matchedCategory = 'Uncategorized'")
    List<TransactionCategoryEntity> findUncategorizedTransactionsByUserIdAndDateRange(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT tce FROM TransactionCategoryEntity tce " +
            "JOIN tce.csvTransaction ct " +
            "WHERE ct.user.id = :userId " +
            "AND ct.transactionDate BETWEEN :startDate AND :endDate " +
            "AND tce.matchedCategory = 'Uncategorized'")
    List<TransactionCategoryEntity> findUncategorizedCsvByUserIdAndDateRange(
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

    boolean existsByTransactionId(String transactionId);

    @Query("SELECT tce FROM TransactionCategoryEntity tce WHERE tce.matchedCategory =:category AND tce.csvTransaction.id =:id")
    Optional<TransactionCategoryEntity> findTransactionCategoryByCategoryAndId(@Param("category") String category, @Param("id") Long id);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.matchedCategory =:category, tce.isUpdated=true WHERE tce.csvTransaction.id =:id")
    void updateTransactionCategoryByCsvIdAndCategory(@Param("id") Long id, @Param("category") String category);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.matchedCategory =:category, tce.isUpdated=true WHERE tce.transaction.id =:id")
    void updateTransactionCategoryByTransactionIdAndCategory(@Param("id") String id, @Param("category") String category);

    @Query("SELECT COUNT(tce) FROM TransactionCategoryEntity tce JOIN tce.csvTransaction ct WHERE tce.isUpdated = TRUE AND ct.transactionDate BETWEEN :start AND :end AND ct.user.id =:userId")
    int findUpdatedCSVTransactionCategories(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("userId") Long userId);

    @Query("SELECT COUNT(tce) FROM TransactionCategoryEntity tce JOIN tce.transaction t WHERE tce.isUpdated = TRUE AND t.posted BETWEEN :start AND :end AND t.account.user.id =:userId")
    int findUpdatedTransactionCategories(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("userId") Long userId);

    @Query("SELECT COUNT(tce) FROM TransactionCategoryEntity tce JOIN tce.csvTransaction ct WHERE (tce.isUpdated = FALSE AND tce.status = 'NEW') AND ct.transactionDate BETWEEN :start AND :end AND ct.user.id =:userId")
    int findNewCSVTransactionCategories(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("userId") Long userId);

    @Query("SELECT COUNT(tce) FROM TransactionCategoryEntity tce JOIN tce.transaction t WHERE (tce.isUpdated = FALSE AND tce.status = 'NEW') AND t.posted BETWEEN :start AND :end AND t.account.user.id =:userId")
    int findNewTransactionCategories(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET " +
            "tce.matchedCategory = :matchedCategory, " +
            "tce.categorizedBy = :categorizedBy, " +
            "tce.categorized_date = :categorizedDate, " +
            "tce.isUpdated = :isUpdated, " +
            "tce.status = :status, " +
            "tce.categoryLevel = :categoryLevel, " +
            "tce.expenseType = :expenseType " +
            "WHERE tce.id = :id")
    void updateTransactionCategory(
            @Param("id") Long id,
            @Param("matchedCategory") String matchedCategory,
            @Param("categorizedBy") String categorizedBy,
            @Param("categorizedDate") LocalDate categorizedDate,
            @Param("isUpdated") boolean isUpdated,
            @Param("status") TransactionCategoryStatus status,
            @Param("categoryLevel") CategoryPriorityLevel categoryLevel,
            @Param("expenseType") CategoryExpenseType expenseType
    );

    @Modifying
    @Query("UPDATE TransactionCategoryEntity tce SET tce.matchedCategory =:category WHERE tce.matchedCategory IS NOT NULL AND tce.id =:id")
    void updateTransactionCategoryByIdNotCategory(@Param("category") String category);
}
