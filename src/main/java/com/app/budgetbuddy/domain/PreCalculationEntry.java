package com.app.budgetbuddy.domain;

import java.math.BigDecimal;

public record PreCalculationEntry(String category, DateRange dateRange, BigDecimal budgeted, BigDecimal actual, EntryType entryType) { }
