package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetScheduleRange;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;
import com.app.budgetbuddy.services.BudgetScheduleRangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
public class BudgetScheduleRangeBuilderService
{
    private final BudgetScheduleRangeService budgetScheduleRangeService;

    @Autowired
    public BudgetScheduleRangeBuilderService(BudgetScheduleRangeService budgetScheduleRangeService)
    {
        this.budgetScheduleRangeService = budgetScheduleRangeService;
    }

    private BigDecimal getSpentOnRangeForScheduleRange(DateRange scheduleRange)
    {
        return null;
    }

    private BigDecimal getBudgetedAmountForScheduleRange(DateRange scheduleRange)
    {
        return null;
    }

    public List<BudgetScheduleRange> createBudgetScheduleRangesBySubBudget(final SubBudget subBudget)
    {
        return null;
    }

    public Optional<BudgetScheduleRange> getBudgetScheduleRangeByDate(LocalDate startDate, LocalDate endDate)
    {
        return null;
    }

    public List<BudgetScheduleRange> getBudgetScheduleRangesByScheduleId(Long scheduleId)
    {
        return null;
    }

    public void updateBudgetScheduleRange(BudgetScheduleRange budgetScheduleRange)
    {

    }

    public void saveBudgetScheduleRanges(List<BudgetScheduleRangeEntity> budgetScheduleRanges)
    {

    }
}
