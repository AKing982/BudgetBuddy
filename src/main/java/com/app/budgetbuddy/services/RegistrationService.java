package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Registration;
import com.app.budgetbuddy.entities.UserEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class RegistrationService
{
    private final UserService userService;

    @Autowired
    public RegistrationService(UserService userService)
    {
        this.userService = userService;
    }

    public Optional<UserEntity> createUser(Registration registration){
        if(registration == null){
            throw new IllegalArgumentException("registration is null");
        }
        UserEntity user = createDefaultUserFromRegistration(registration);
        return Optional.of(user);
    }

    private UserEntity createDefaultUserFromRegistration(Registration registration){
        return userService.createUserFromRegistration(registration);
    }
}
