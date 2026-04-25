package com.app.budgetbuddy.domain;

import java.util.List;

public record FuturePeriodRequest(DateRange dateRange, List<FuturePeriodCategories> categories, Long userId) {
}
