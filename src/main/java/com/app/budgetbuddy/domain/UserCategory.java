package com.app.budgetbuddy.domain;

public record UserCategory(Long id, String category, Long userId, boolean isActive, String type, boolean isSystemOverride) {
}
