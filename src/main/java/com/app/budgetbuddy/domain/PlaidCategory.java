package com.app.budgetbuddy.domain;

public class PlaidCategory
{
    private final String primaryCategory;
    private final String secondaryCategory;

    public PlaidCategory(String primaryCategory, String secondaryCategory) {
        this.primaryCategory = primaryCategory;
        this.secondaryCategory = secondaryCategory;
    }

    public String getPrimaryCategory() {
        return primaryCategory;
    }

    public String getSecondaryCategory() {
        return secondaryCategory;
    }
}
