package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.UserLogEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.UserLogRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class UserLogServiceImpl implements UserLogService
{
    private final UserLogRepository userLogRepository;

    @Autowired
    public UserLogServiceImpl(UserLogRepository userLogRepository)
    {
        this.userLogRepository = userLogRepository;
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
    public Optional<UserLogEntity> findById(Long id) {
        return Optional.empty();
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
}
