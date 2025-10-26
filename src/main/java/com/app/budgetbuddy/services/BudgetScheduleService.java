package com.app.budgetbuddy.services;


import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetScheduleEntity;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BudgetScheduleService extends ServiceModel<BudgetScheduleEntity>
{
    BudgetSchedule createBudgetScheduleByEntity(BudgetScheduleEntity budgetScheduleEntity);

    Optional<BudgetSchedule> findBudgetScheduleById(Long budgetScheduleId);

    Optional<BudgetSchedule> findBudgetScheduleByUserIdAndCurrentDate(Long userId, LocalDate currentDate);

    void updateBudgetSchedule(BudgetSchedule budgetSchedule);

    Optional<BudgetScheduleEntity> saveBudgetSchedule(BudgetSchedule budgetSchedule);

    Optional<BudgetScheduleEntity> saveBudgetScheduleEntity(BudgetScheduleEntity budgetScheduleEntity);

    Optional<BudgetScheduleEntity> buildBudgetScheduleEntity(final BudgetSchedule budgetSchedule);

    Optional<BudgetSchedule> getBudgetScheduleByDate(Long budgetId, LocalDate startDate, LocalDate endDate);

}
