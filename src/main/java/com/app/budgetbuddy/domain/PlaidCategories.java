package com.app.budgetbuddy.domain;

import lombok.Getter;

@Getter
public enum PlaidCategories
{
    FINANCIAL("Financial", "Service"),
    AUTOMOTIVE("Automotive", "Shops"),
    CREDIT("Credit", "Transfer"),
    THIRD_PARTY_TRANSFER("Third Party", "Transfer"),
    SUPERMARKETS_AND_GROCERIES("Supermarkets and Groceries", "Shops"),
    WITHDRAWAL("Withdrawal", "Transfer"),
    GAS_STATIONS("Gas Stations", "Travel"),
    SERVICE("", "Service"),
    PAYROLL("Payroll", "Transfer"),
    DIGITAL_PURCHASE("Digital Purchase", "Shops"),
    INTEREST_EARNED("Interest Earned", "Interest"),
    SPORTS_CLUBS("Sports Clubs", "Recreation"),
    UTILITIES("Utilities", "Service"),
    GLASSES_AND_OPTOMETRIST("Glasses and Optometrist", "Shops"),
    PERSONAL_CARE("Personal Care", "Service"),
    RESTAURANTS("Restaurants", "Food and Drink"),
    GYMS_AND_FITNESS_CENTERS("Gyms and Fitness Centers", "Recreation"),
    COMPUTERS_AND_ELECTRONICS("Computers and Electronics", "Shops"),
    FOOD_AND_DRINK("", "Food and Drink"),
    INSURANCE("Insurance", "Service"),
    SUBSCRIPTION("Subscription", "Service"),
    PHARMACIES("Pharmacies", "Shops"),
    CREDIT_CARD("Credit Card", "Payment"),
    DEPARTMENT_STORES("Department Stores", "Shops"),
    TAXI("Taxi", "Travel"),
    AIRLINES_AND_AVIATION_SERVICES("Airlines and Aviation Services", "Travel");

    private final String primaryCategory;
    private final String secondaryCategory;

    PlaidCategories(final String primaryCategory, final String secondaryCategory){
        this.primaryCategory = primaryCategory;
        this.secondaryCategory = secondaryCategory;
    }



}
