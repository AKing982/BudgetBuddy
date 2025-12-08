package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Registration;
import com.app.budgetbuddy.domain.User;
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
    @Transactional
    public boolean doesUserHaveOverride(Long userId)
    {
        try
        {
            Optional<UserEntity> userWithOverrideAccess = userRepository.findUserByIdAndOverrideUploadEnabled(userId);
            return userWithOverrideAccess.map(UserEntity::isOverrideUploadEnabled).orElse(false);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the user override access: ", e);
            return false;
        }
    }

    @Override
    @Transactional
    public void updateUserOverrideAccess(Long userId, boolean overrideAccess)
    {
        try
        {
            userRepository.updateUserOverrideUploadEnabled(userId, overrideAccess);

        }catch(DataAccessException e){
            log.error("There was an error updating the user override access: ", e);
        }
    }

    @Override
    @Transactional
    public Optional<User> getUserById(Long id)
    {
        if(id < 1)
        {
            return Optional.empty();
        }
        try
        {
            Optional<UserEntity> userEntity = userRepository.findById(id);
            if(userEntity.isEmpty())
            {
                return Optional.empty();
            }
            UserEntity user = userEntity.get();
            return Optional.of(convertUserEntity(user));
        }catch(DataAccessException e){
            log.error("There was an error getting the user id from the database", e);
            return Optional.empty();
        }
    }

    private User convertUserEntity(UserEntity userEntity)
    {
        User user = new User();
        user.setFirstName(userEntity.getFirstName());
        user.setLastName(userEntity.getLastName());
        user.setUsername(userEntity.getUsername());
        user.setPassword(userEntity.getPassword());
        return user;
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
