package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BudgetScheduleRangeRepository extends JpaRepository<BudgetScheduleRangeEntity, Long>
{
    @Query("SELECT bsr FROM BudgetScheduleRangeEntity bsr WHERE bsr.rangeStart =:start AND bsr.rangeEnd =:end AND bsr.budgetSchedule.id =:id")
    List<BudgetScheduleRangeEntity> findBudgetScheduleRangeEntitiesByRangeAndScheduleId(@Param("start")LocalDate startDate, @Param("end") LocalDate endDate, @Param("id") Long id);

}
