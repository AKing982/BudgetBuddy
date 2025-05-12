package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.UserLogRequest;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.entities.UserLogEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.repositories.UserLogRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class UserLogServiceImpl implements UserLogService
{
    private final UserLogRepository userLogRepository;
    private final UserRepository userRepository;

    @Autowired
    public UserLogServiceImpl(UserLogRepository userLogRepository,
                              UserRepository userRepository)
    {
        this.userLogRepository = userLogRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional
    public Collection<UserLogEntity> findAll()
    {
        try
        {
            return userLogRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error fetching all the user log entries: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(UserLogEntity userLogEntity)
    {
        if(userLogEntity == null)
        {
            return;
        }
        try
        {
            userLogRepository.save(userLogEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the user log entry: ", e);
        }
    }

    @Override
    @Transactional
    public void delete(UserLogEntity userLogEntity)
    {
        if(userLogEntity == null)
        {
            return;
        }
        try
        {
            userLogRepository.delete(userLogEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the user log entry: ", e);
        }
    }

    @Override
    public Optional<UserLogEntity> findById(Long id)
    {
        try
        {
            return userLogRepository.findById(id);
        }catch(DataAccessException e){
            log.error("There was an error finding the user log entry: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<UserLogEntity> getActiveUserLogByUserId(Long userId)
    {
        return userLogRepository.findActiveUserById(userId);
    }

    @Override
    @Transactional
    public boolean isUserActive(Long userId)
    {
        Optional<UserLogEntity> userLogEntity = userLogRepository.findActiveUserById(userId);
        return userLogEntity.isPresent();
    }

    @Override
    public Optional<UserLogEntity> updateUserLog(Long userLogId, UserLogRequest userLogRequest)
    {
        if(userLogRequest == null)
        {
            return Optional.empty();
        }

        try
        {
            Long userId = userLogRequest.userId();
            LocalDateTime lastLogin = userLogRequest.lastLogin();
            LocalDateTime lastLogout = userLogRequest.lastLogout();
            int sessionDuration = userLogRequest.sessionDuration();
            int loginAttempts = userLogRequest.loginAttempts();
            boolean isActive = userLogRequest.isActive();
            // Get the latest user log for the user
            Optional<UserLogEntity> userLogEntityOpt = userLogRepository.findByUserIdAndId(userLogId, userId);
            if(userLogEntityOpt.isEmpty())
            {
                return Optional.empty();
            }
            UserLogEntity userLogEntity = userLogEntityOpt.get();
            userLogEntity.setLastLogout(lastLogout);
            userLogEntity.setLastLogin(lastLogin);
            userLogEntity.setSessionDuration(sessionDuration);
            userLogEntity.setLoginAttempts(loginAttempts);
            userLogEntity.setActive(isActive);
            Optional<UserLogEntity> updatedUserLog = userLogRepository.updateUserLogEntity(userLogEntity, userId);
            log.info("User Log: {} has been updated successfully.", userLogEntity);
            return updatedUserLog;
        }catch(DataAccessException e){
            log.error("There was an error updating the user log entry: ", e);
            return Optional.empty();
        }
    }

    @Override
    public Optional<UserLogEntity> saveUserLogRequest(UserLogRequest userLogRequest)
    {
        if(userLogRequest == null)
        {
            return Optional.empty();
        }
        try
        {
            Long userId = userLogRequest.userId();
            Optional<UserEntity> userEntityOptional = userRepository.findById(userId);
            if(userEntityOptional.isEmpty())
            {
                throw new UserNotFoundException("User not found");
            }
            UserEntity userEntity = userEntityOptional.get();
            LocalDateTime lastLogin = userLogRequest.lastLogin();
            LocalDateTime lastLogout = userLogRequest.lastLogout();
            int sessionDuration = userLogRequest.sessionDuration();
            int loginAttempts = userLogRequest.loginAttempts();
            boolean isActive = userLogRequest.isActive();
            UserLogEntity userLogEntity = UserLogEntity.builder()
                    .loginAttempts(loginAttempts)
                    .sessionDuration(sessionDuration)
                    .lastLogin(lastLogin)
                    .lastLogout(lastLogout)
                    .isActive(isActive)
                    .user(userEntity).build();
            userLogRepository.save(userLogEntity);
            log.info("Successfully saved User Log: {}", userLogEntity);
            return Optional.of(userLogEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the user log entry: ", e);
            return Optional.empty();
        }
    }
}
