package com.app.budgetbuddy.domain;

import java.time.LocalDate;
import java.util.List;

public record FuturePointerRequest(int ahead, AheadUnit unit, Long templateId, boolean isManual, List<FuturePeriodCategories> categories) {
    public enum AheadUnit {
        WEEKS,
        MONTHS
    }
    public DateRange horizon(LocalDate from){
        return switch (unit) {
            case WEEKS -> DateRange.createDateRange(from, from.plusWeeks(ahead).minusDays(1));
            case MONTHS -> DateRange.createDateRange(from, from.plusMonths(ahead).minusDays(1));
        };
    }
}
