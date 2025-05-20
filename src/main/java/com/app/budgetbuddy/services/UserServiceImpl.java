package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Registration;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
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
    @Transactional
    public Long findUserIdByEmail(String email) {
        return userRepository.findIdByEmail(email);
    }

    @Override
    @Transactional
    public Long findUserIdByUsername(String username) {
        return userRepository.findIdByUsername(username);
    }

    @Override
    @Transactional
    public Long findMaxUserId() {
        return userRepository.findMaxId();
    }

    @Override
    public void resetPassword(String email, String newPassword)
    {
        if(email == null || newPassword == null)
        {
            log.debug("Email or password is invalid");
            return;
        }
        Optional<UserEntity> user = userRepository.findByEmail(email);
        if(user.isEmpty())
        {
            log.debug("User not found with email {}", email);
            throw new UserNotFoundException("User not found with email " + email);
        }
        UserEntity userEntity = user.get();
        userEntity.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(userEntity);
    }

}
