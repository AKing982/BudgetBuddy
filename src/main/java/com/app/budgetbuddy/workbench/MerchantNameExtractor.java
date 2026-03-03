package com.app.budgetbuddy.workbench;

public interface MerchantNameExtractor
{
    boolean supports(String institution);
    String extract(String description, String extendedDescription);
}
