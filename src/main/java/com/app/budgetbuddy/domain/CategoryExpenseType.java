package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.exceptions.DataException;

public enum CategoryExpenseType
{

    FIXED("FIXED"),
    VARIABLE("VARIABLE"),
    NON_EXPENSE("NON-EXPENSE"),
    FIXED_NON_EXPENSE("FIXED NON-EXPENSE");

    private final String value;

    CategoryExpenseType(String value) {
        this.value = value;
    }

    public String getValue() {
        return value;
    }

    public static CategoryExpenseType fromString(String type) {
        if(type == null || type.isEmpty()) {
            return VARIABLE;
        }
        for(CategoryExpenseType expenseType : CategoryExpenseType.values()) {
            if(expenseType.value.equalsIgnoreCase(type)) {
                return expenseType;
            }
        }
        return VARIABLE; // safe default instead of throwing
    }
}
