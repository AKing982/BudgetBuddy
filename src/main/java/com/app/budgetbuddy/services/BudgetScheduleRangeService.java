package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetScheduleRange;
import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;

import java.time.LocalDate;
import java.util.List;

public interface BudgetScheduleRangeService extends ServiceModel<BudgetScheduleRangeEntity>
{
    List<BudgetScheduleRange> getBudgetScheduleRangesByRangeAndScheduleId(LocalDate startDate, LocalDate endDate, Long scheduleId);
}
