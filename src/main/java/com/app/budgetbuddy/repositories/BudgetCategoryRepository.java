package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetCategoryRepository extends JpaRepository<BudgetCategoryEntity, Long>
{
    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.budget.user.id =:id")
    List<BudgetCategoryEntity> findAllByUserId(@Param("id") Long id);

    @Query("SELECT SUM(u.actual) FROM BudgetCategoryEntity u WHERE u.categoryName = 'Income' AND u.startDate >=:start AND u.endDate <=:end AND u.subBudget.id =:id")
    BigDecimal findIncomeTotalByUserAndDateRange(@Param("id") Long budgetId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT SUM(u.actual) FROM BudgetCategoryEntity u WHERE u.categoryName NOT IN ('Income', 'Deposit', 'Uncategorized', 'Refund') AND u.startDate >=:start AND u.endDate <=:end AND u.subBudget.id =:id")
    BigDecimal findExpenseTotalByUserAndDateRange(@Param("id") Long budgetId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.budget.user.id =:id AND u.active = true")
    List<BudgetCategoryEntity> findActiveCategoriesByUser(@Param("id") Long userId);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.id =:id")
    List<BudgetCategoryEntity> findByBudgetId(@Param("id") Long budgetId);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.startDate >=:start AND u.endDate <=:end AND u.subBudget.budget.user.id =:userId AND u.categoryName NOT IN ('Income', 'Deposit', 'Uncategorized')")
    List<BudgetCategoryEntity> findByDateRangeAndUserId(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("userId") Long userId);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.id =:id AND u.categoryName =:category AND u.startDate >=:start AND u.endDate <=:endDate")
    Optional<BudgetCategoryEntity> findBySubBudgetIdAndCategoryAndDateRange(@Param("id") Long budgetId, @Param("category") String category, @Param("start") LocalDate start, @Param("endDate") LocalDate endDate);

    @Query("SELECT CASE WHEN COUNT(*) = 1 THEN TRUE ELSE FALSE END " +
           "FROM BudgetCategoryEntity bc " +
           "WHERE bc.categoryName = :category " +
           "AND bc.startDate >= :startDate " +
           "AND bc.endDate <= :endDate " +
           "AND bc.subBudget.id = :subBudgetId " +
           "AND bc.active = TRUE")
    boolean existsByCategoryDateRange(@Param("category") String category, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("subBudgetId") Long subBudgetId);

    @Modifying
    @Query("UPDATE BudgetCategoryEntity u SET u.categoryName =:category WHERE u.id =:id")
    void updateCategoryNameById(@Param("id") Long id, @Param("category") String category);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.id =:id AND u.startDate =:start AND u.endDate =:end")
    List<BudgetCategoryEntity> findByBudgetIdAndDateRange(@Param("id") Long budgetId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.budget.user.id =:id AND u.startDate =:startDate AND u.endDate =:endDate")
    List<BudgetCategoryEntity> findCategoriesByUserAndDateRange(@Param("id") Long userId, @Param("startDate")LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query("SELECT SUM(u.budgetedAmount) FROM BudgetCategoryEntity u WHERE u.subBudget.budget.user.id =:id AND u.startDate =:start AND u.endDate =:end")
    Integer sumBudgetedAmountByUserAndDateRange(@Param("id") Long userId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.subBudget.id =:id AND :date BETWEEN :start AND :end")
    List<BudgetCategoryEntity> findBudgetCategoriesByDate(@Param("id") Long subBudgetId, @Param("date") LocalDate currentDate, @Param("start") LocalDate startDate, @Param("end") LocalDate endDate);

    @Query("SELECT u FROM BudgetCategoryEntity u WHERE u.user.id =:userId")
    List<BudgetCategoryEntity> findCategoriesByUser(@Param("userId") Long userId);

    @Query("SELECT u.actual FROM BudgetCategoryEntity u WHERE u.categoryName =:category AND u.startDate >=:start AND u.endDate <=:end AND u.subBudget.id =:id")
    BigDecimal findActualAmountByCategoryAndDateRange(@Param("category") String category, @Param("start") LocalDate start, @Param("end") LocalDate end, @Param("id") Long subBudgetId);

    @Modifying
    @Query("""
        UPDATE BudgetCategoryEntity bc
        SET bc.budgetedAmount = :budgeted
        WHERE bc.categoryName = :category
        AND bc.subBudget.budget.user.id = :userId
        AND bc.subBudget.startDate >= :startDate
        AND bc.subBudget.endDate <= :endDate
        """)
    void updateBudgetedAmount(
            @Param("category") String category,
            @Param("budgeted") double budgeted,
            @Param("userId") Long userId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Query(value = """
    SELECT bc.category_name,
           TO_CHAR(bc.startdate, 'YYYY-MM') AS month,
           bc.budgetedamount - SUM(bc.actual) AS totalSaved
    FROM budgetcategories bc
    JOIN subbudgets sb ON bc.sub_budgetid = sb.id
    JOIN budgets b ON sb.budgetid = b.budgetid
    WHERE bc.category_name <> 'Uncategorized'
      AND b.userid = :userId
      AND bc.startdate >= :startDate AND bc.enddate <= :endDate
    GROUP BY bc.category_name, bc.budgetedamount, TO_CHAR(bc.startdate, 'YYYY-MM')
    """, nativeQuery = true)
    List<Object[]> findHistoricalMonthStatsByCategory(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    @Query(value = """
    SELECT bc.category_name,
           TO_CHAR(DATE_TRUNC('month', bc.startdate), 'YYYY-MM') AS month,
           SUM(bc.budgetedamount) - SUM(bc.actual) AS totalSaved,
           SUM(bc.actual) AS totalSpent,
           SUM(bc.budgetedamount) AS totalBudgeted,
           CASE WHEN SUM(bc.budgetedamount) = 0 THEN 0 ELSE ROUND(SUM(bc.actual)/SUM(bc.budgetedamount) * 100, 2) END AS percentSaved,
           AVG(bc.budgetedamount - bc.actual) AS averageSaved,
           AVG(bc.actual) AS averageSpent
    FROM budgetcategories bc
    INNER JOIN subbudgets sb ON bc.sub_budgetid = sb.id
    INNER JOIN budgets b ON sb.budgetid = b.budgetid
    WHERE bc.category_name NOT IN ('Uncategorized')
      AND bc.startdate >= :startDate
      AND bc.enddate <= :endDate
      AND b.userid = :userId
    GROUP BY bc.category_name, TO_CHAR(DATE_TRUNC('month', bc.startdate), 'YYYY-MM')
    """, nativeQuery = true)
    List<Object[]> findHistoricalMonthHistoryByCategory(@Param("userId") Long userId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

}
