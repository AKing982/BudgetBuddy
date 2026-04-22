package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum BPTemplateType
{
    BIWEEKLY_STD("Bi-Weekly Standard Template"),
    MONTHLY_STD("Monthly Standard Template"),
    WEEKLY_STD("Weekly Standard Template"),
    INCOME_STD("Standard Rolling Income Template"),
    TWO_MONTHLY_STD("Two Monthly Standard Template"),
    THREE_MONTHLY_STD("Three Monthly Standard Template"),
    BIWEEKLY_PAYCHECK("Bi-Weekly Paycheck Template"),
    MONTHLY_PAYCHECK("Monthly Paycheck Template"),
    TWO_MONTHLY_PAYCHECK("Two Monthly Paycheck Template"),
    THREE_MONTHLY_PAYCHECK("Three Monthly Paycheck Template"),
    FIFTY_THIRTY_TWENTY_MONTHLY("50/30/20 Monthly Template"),
    FIFTY_THIRTY_TWENTY_BIWEEKLY("50/30/20 Bi-Weekly Template"),
    MONTHLY_BALANCE_SHEET("Monthly Balance Sheet"),
    BASIC_ESSENTIALS("Basic Essentials Expenses Template");

    private String type;

    BPTemplateType(String type)
    {
        this.type = type;
    }

    @JsonValue
    public String getType() {
        return type;
    }

    @JsonCreator
    public static BPTemplateType fromString(String value) {
        for (BPTemplateType t : values()) {
            if (t.type.equalsIgnoreCase(value)) {
                return t;
            }
        }
        // Fallback: try matching by enum name (e.g. "INCOME_STD")
        try {
            return BPTemplateType.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown BPTemplateType: " + value);
        }
    }

}
