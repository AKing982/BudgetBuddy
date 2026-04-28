package com.app.budgetbuddy.domain;

import java.math.BigDecimal;

public record BPGridCell(int columnIndex, DateRange dateRange, BigDecimal actual, BigDecimal planned, BigDecimal budgeted, boolean isBalance, boolean isEditable) {
}
