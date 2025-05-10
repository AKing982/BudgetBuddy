package com.app.budgetbuddy.domain;

import java.time.LocalDateTime;

public record UserLogRequest(Long userId, LocalDateTime lastLogin, LocalDateTime lastLogout, int sessionDuration, int loginAttempts) { }
