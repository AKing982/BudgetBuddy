package com.app.budgetbuddy.domain;

import java.util.List;

public record BudgetPlannerRequest(BPTemplateType templateType, boolean isCustom, boolean requireHeaders, List<String> categoryHeaders, List<CategoryAllocation> categoryAllocations, Period period, BPIncomeCriteria incomeCriteria, Long userId, List<DateRange> dateRanges,
                                   Integer startDay) {
}
