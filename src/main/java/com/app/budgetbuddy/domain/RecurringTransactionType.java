package com.app.budgetbuddy.domain;

import lombok.Getter;

@Getter
public enum RecurringTransactionType
{
    OUTFLOW_STREAM("outflowStreams"),
    INFLOW_STREAM("inflowStreams");

    private final String value;

    RecurringTransactionType(String value) {
        this.value = value;
    }

}

