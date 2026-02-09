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
    PET("Pet");

    private String type;

    CategoryType(String type)
    {
        this.type = type;
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
