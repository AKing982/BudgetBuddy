package com.example.userservice.workbench.dto;

import java.time.LocalDateTime;

public record UserLogDTO(Long userLogID, int userID, boolean isActive, LocalDateTime lastLogin, LocalDateTime lastLogout, int loginAttempts, int duration) {
}
