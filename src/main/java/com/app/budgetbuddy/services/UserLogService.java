package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.UserLogEntity;

import java.util.Optional;

public interface UserLogService extends ServiceModel<UserLogEntity>
{
    Optional<UserLogEntity> getActiveUserLogByUserId(Long userId);
    boolean isUserActive(Long userId);
}
