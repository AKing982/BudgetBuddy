package com.app.budgetbuddy.domain;

public enum CategoryMatchRule
{
    MERCHANT_EXACT,
    MERCHANT_CONTAINS,
    DESCRIPTION_EXACT,
    DESCRIPTION_CONTAINS,
    DESCRIPTION_STARTS_WITH,
    EITHER,
    BOTH
}
