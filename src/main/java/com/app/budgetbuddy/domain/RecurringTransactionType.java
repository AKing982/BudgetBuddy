package com.app.budgetbuddy.domain;

import lombok.Getter;

@Getter
public enum RecurringTransactionType
{
    OUTFLOW_STREAM("outflowStreams"),
    INFLOW_STREAM("inflowStreams"),
    UNKNOWN("UNKNOWN");

    private final String value;

    RecurringTransactionType(String value) {
        this.value = value;
    }

    public static RecurringTransactionType fromString(String text) {
        for (RecurringTransactionType type : RecurringTransactionType.values()) {
            if (type.value.equalsIgnoreCase(text)) {
                return type;
            }
        }
        return UNKNOWN; // or throw an exception if you prefer
    }

}

