package com.example.userservice.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class UserLog {
    private Long userLogID;
    private User user;
    private boolean isActive;
    private LocalDateTime lastLoginTime;
    private LocalDateTime lastLogoutTime;
    private int loginAttempts;
    private int duration;

    public UserLog(Long userLogID, User user, boolean isActive, LocalDateTime lastLoginTime, LocalDateTime lastLogoutTime, int loginAttempts, int duration) {
        this.userLogID = userLogID;
        this.user = user;
        this.isActive = isActive;
        this.lastLoginTime = lastLoginTime;
        this.lastLogoutTime = lastLogoutTime;
        this.loginAttempts = loginAttempts;
        this.duration = duration;
    }
}
