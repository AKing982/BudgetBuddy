package com.app.budgetbuddy.domain;

public record UserCategory(String category, Long userId, boolean isActive, String type, boolean isSystemOverride) {
}
