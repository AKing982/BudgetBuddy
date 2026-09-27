package com.app.budgetbuddy.domain;

import java.util.List;

public record FuturePointerRequest(DateRange dateRange, Long templateDetailId, boolean isManual, List<FuturePeriodCategories> categories) {
}
