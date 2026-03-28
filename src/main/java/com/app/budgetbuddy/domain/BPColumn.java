package com.app.budgetbuddy.domain;

public record BPColumn(int columnIndex, DateRange dateRange, Period period, BPColumnType columnType, boolean isHeader) {
}
