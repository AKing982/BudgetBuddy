package com.app.budgetbuddy.domain;

import java.util.List;

public record BudgetPlannerRequest(BPTemplateType templateType, Long userId, List<DateRange> dateRanges) {
}
