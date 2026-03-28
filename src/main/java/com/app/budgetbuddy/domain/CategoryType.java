package com.app.budgetbuddy.domain;

import lombok.Getter;
import org.springframework.web.bind.annotation.GetMapping;

@Getter
public enum CategoryType
{
    GAS("Gas"),
    GROCERIES("Groceries"),
    RESTAURANTS("Restaurants"),
    ORDER_OUT("Order Out"),
    PAYROLL("Payroll"),
    INCOME("Income"),
    PAYMENT("Payment"),
    SUBSCRIPTION("Subscription"),
    RENT("Rent"),
    UTILITIES("Utilities"),
    OTHER("Other"),
    HAIRCUT("Haircut"),
    INSURANCE("Insurance"),
    ELECTRIC("Electric"),
    GAS_UTILITIES("Gas Utilities"),
    COFFEE("Coffee"),
    TRIP("Trip"),
    UNCATEGORIZED("Uncategorized"),
    WITHDRAWAL("Withdrawal"),
    DEPOSIT("Deposit"),
    REFUND("Refund"),
    TRANSFER("Transfer"),
    SAVINGS("Savings"),
    NONE("None"),
    PET("Pet");

    private String type;

    CategoryType(String type)
    {
        this.type = type;
    }

    public boolean isExpense()
    {
        return switch (this) {
            case PAYMENT, GROCERIES, RESTAURANTS, ORDER_OUT, GAS, SUBSCRIPTION, RENT, UTILITIES, HAIRCUT, INSURANCE, ELECTRIC, GAS_UTILITIES, COFFEE, TRIP, OTHER, PET -> true;
            default -> false;
        };
    }

    public boolean isIncome()
    {
        return switch(this){
            case INCOME, PAYROLL, DEPOSIT, REFUND, TRANSFER, NONE -> true;
            default -> false;
        };
    }

    public boolean isSavings()
    {
        return this == SAVINGS;
    }

    public static CategoryType getCategoryType(String category)
    {
        for (CategoryType ct : CategoryType.values()) {
            if (ct.type.equalsIgnoreCase(category)) {
                return ct;
            }
        }
        throw new IllegalArgumentException("No matching CategoryType for input: " + category);
    }

}
