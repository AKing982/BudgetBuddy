package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Registration;
import com.app.budgetbuddy.entities.UserEntity;

import java.util.Optional;

public interface UserService extends ServiceModel<UserEntity>
{
    Optional<UserEntity> findByEmail(String email);
    UserEntity createUserFromRegistration(Registration registration);
    Optional<UserEntity> findByUsername(String username);
    Long findUserIdByEmail(String email);
    Long findUserIdByUsername(String username);
}
