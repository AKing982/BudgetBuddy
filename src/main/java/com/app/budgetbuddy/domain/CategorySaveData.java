package com.app.budgetbuddy.domain;

public record CategorySaveData(String transactionId, String category, CategoryMatchingData advancedMatching, boolean isCustomCategory,
                               boolean overrideSystemCategory) {
}
