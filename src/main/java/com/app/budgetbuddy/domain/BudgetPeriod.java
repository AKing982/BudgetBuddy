package com.app.budgetbuddy.domain;

import lombok.Getter;

import java.time.LocalDate;
import java.util.Objects;

@Getter
public class BudgetPeriod {
    private final Period period;
    private final LocalDate startDate;
    private final LocalDate endDate;

    public BudgetPeriod(Period period, LocalDate startDate, LocalDate endDate) {
        this.period = period;
        this.startDate = startDate;
        this.endDate = endDate;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BudgetPeriod that = (BudgetPeriod) o;
        return period == that.period && Objects.equals(startDate, that.startDate) && Objects.equals(endDate, that.endDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(period, startDate, endDate);
    }

    public boolean isToday(){
        return getStartDate().equals(getEndDate());
    }
}
