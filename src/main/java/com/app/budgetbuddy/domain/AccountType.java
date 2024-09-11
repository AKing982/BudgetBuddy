package com.app.budgetbuddy.domain;

import lombok.Getter;

@Getter
public enum AccountType {
    INVESTMENT("Investment"),
    CREDIT("Credit"),
    DEPOSITORY("Depository"),
    LOAN("Loan");

    private String value;

    private AccountType(String value) {
        this.value = value;
    }

    public String toString() {
        return String.valueOf(value);
    }

    public static AccountType fromString(String text) {
        for (AccountType type : AccountType.values()) {
            if (type.value.equalsIgnoreCase(text)) {
                return type;
            }
        }
        throw new IllegalArgumentException("No constant with text " + text + " found");
    }
}
