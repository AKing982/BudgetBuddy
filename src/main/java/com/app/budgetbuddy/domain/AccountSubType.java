package com.app.budgetbuddy.domain;

import lombok.Getter;

@Getter
public enum AccountSubType
{
    CD("CD"),
    CHECKING("Checking"),
    SAVINGS("Savings"),
    CREDIT_CARD("Credit Card"),
    MONEY_MARKET("Money Market"),
    MORTGAGE("Mortgage"),
    STUDENT("Student"),
    IRA("Ira"),
    ISA("Isa"),
    _401A("401a"),
    _401K("401k");

    private String value;

    private AccountSubType(String value) {
        this.value = value;
    }

    public static AccountSubType fromString(String text) {
        for (AccountSubType subType : AccountSubType.values()) {
            if (subType.value.equalsIgnoreCase(text)) {
                return subType;
            }
        }
        throw new IllegalArgumentException("No constant with text " + text + " found");
    }

    public String toString() {
        return String.valueOf(value);
    }
}
