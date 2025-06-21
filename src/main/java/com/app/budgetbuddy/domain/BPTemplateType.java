package com.app.budgetbuddy.domain;

public enum BPTemplateType
{
    BIWEEKLY_STD("Bi-Weekly Standard Template"),
    MONTHLY_STD("Monthly Standard Template"),
    TWO_MONTHLY_STD("Two Monthly Standard Template"),
    THREE_MONTHLY_STD("Three Monthly Standard Template"),
    BIWEEKLY_PAYCHECK("Bi-Weekly Paycheck Template"),
    MONTHLY_PAYCHECK("Monthly Paycheck Template"),
    TWO_MONTHLY_PAYCHECK("Two Monthly Paycheck Template"),
    THREE_MONTHLY_PAYCHECK("Three Monthly Paycheck Template"),
    FIFTY_THIRTY_TWENTY_MONTHLY("50/30/20 Monthly Template"),
    FIFTY_THIRTY_TWENTY_BIWEEKLY("50/30/20 Bi-Weekly Template"),
    BASIC_ESSENTIALS("Basic Essentials Expenses Template");

    private String type;

    BPTemplateType(String type)
    {
        this.type = type;
    }

}
