package com.app.budgetbuddy.domain;

import java.util.List;

public record BudgetPlannerRequest(BPTemplateType templateType, Period period, Long userId, List<DateRange> dateRanges) {
}
