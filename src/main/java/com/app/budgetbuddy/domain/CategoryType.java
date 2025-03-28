package com.app.budgetbuddy.domain;

public enum CategoryType
{
    GAS("Gas"),
    GROCERIES("Groceries"),
    RESTAURANTS("Restaurants"),
    ORDER_OUT("Order Out"),
    PAYROLL("Payroll"),
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
    PET("Pet");

    private String type;

    CategoryType(String type)
    {
        this.type = type;
    }

}
