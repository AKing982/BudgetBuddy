package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Registration;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.repositories.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class UserServiceImpl implements UserService
{
    private final UserRepository userRepository;
    private PasswordEncoder passwordEncoder;
    private Logger LOGGER = LoggerFactory.getLogger(UserServiceImpl.class);

    @Autowired
    public UserServiceImpl(UserRepository userRepository){
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    public Collection<UserEntity> findAll() {
        return userRepository.findAll();
    }

    @Override
    public void save(UserEntity userEntity) {
        userRepository.save(userEntity);
    }

    @Override
    public void delete(UserEntity userEntity) {
        userRepository.delete(userEntity);
    }

    @Override
    public Optional<UserEntity> findById(Long id) {
        return userRepository.findById(id);
    }

    @Override
    public Optional<UserEntity> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    @Override
    public UserEntity createUserFromRegistration(Registration registration) {
        UserEntity userEntity = new UserEntity();
        userEntity.setEmail(registration.getEmail());
        String hashedPassword = passwordEncoder.encode(registration.getPassword());
        LOGGER.info("Hashed password: " + hashedPassword);
        userEntity.setPassword(hashedPassword);
        userEntity.setFirstName(registration.getFirstName());
        userEntity.setLastName(registration.getLastName());
        userEntity.setUsername(registration.getUsername());
        LOGGER.info("Saving User from Registration: {} ", userEntity.toString());

        return userRepository.save(userEntity);
    }

    @Override
    public Optional<UserEntity> findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public Long findUserIdByEmail(String email) {
        return userRepository.findIdByEmail(email);
    }

    @Override
    public Long findUserIdByUsername(String username) {
        return userRepository.findIdByUsername(username);
    }
}
