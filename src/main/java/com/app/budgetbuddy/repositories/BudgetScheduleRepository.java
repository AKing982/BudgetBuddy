package com.app.budgetbuddy.repositories;


import com.app.budgetbuddy.domain.PeriodType;
import com.app.budgetbuddy.domain.ScheduleStatus;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetScheduleRepository extends JpaRepository<BudgetScheduleEntity, Long>
{
    @Query("SELECT bs FROM BudgetScheduleEntity bs WHERE bs.budget.id = :budgetId")
    Optional<BudgetScheduleEntity> findByBudgetId(@Param("budgetId") Long budgetId);

    @Query("SELECT bs FROM BudgetScheduleEntity bs WHERE bs.status = :status")
    List<BudgetScheduleEntity> findByStatus(@Param("status") ScheduleStatus status);

    @Query("SELECT bs FROM BudgetScheduleEntity bs WHERE bs.startDate =:start AND bs.endDate =:end AND bs.budget.id =:id")
    Optional<BudgetScheduleEntity> findByBudgetIdAndDates(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("id") Long id);

    @Query("SELECT bs FROM BudgetScheduleEntity bs WHERE bs.startDate <= :date AND bs.endDate >= :date")
    List<BudgetScheduleEntity> findActiveSchedulesForDate(@Param("date") LocalDate date);

    @Query("SELECT bs FROM BudgetScheduleEntity bs WHERE bs.periodType = :periodType")
    List<BudgetScheduleEntity> findByPeriodType(@Param("periodType") PeriodType periodType);

    @Query("SELECT bs FROM BudgetScheduleEntity bs WHERE bs.startDate BETWEEN :startDate AND :endDate")
    List<BudgetScheduleEntity> findSchedulesInDateRange(
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
}
