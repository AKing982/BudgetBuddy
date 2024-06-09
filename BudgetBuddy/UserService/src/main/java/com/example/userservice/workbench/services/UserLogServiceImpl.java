package com.example.userservice.workbench.services;

import com.example.userservice.entities.UserLogEntity;
import com.example.userservice.workbench.repositories.UserLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class UserLogServiceImpl implements UserLogService
{
    private final UserLogRepository userLogRepository;

    @Autowired
    public UserLogServiceImpl(UserLogRepository userLogRepository){
        this.userLogRepository = userLogRepository;
    }

    @Override
    public void save(UserLogEntity userLogEntity) {

    }

    @Override
    public void update(UserLogEntity userLogEntity) {

    }

    @Override
    public void delete(UserLogEntity userLogEntity) {

    }

    @Override
    public void deleteAll() {

    }

    @Override
    public Optional<UserLogEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<UserLogEntity> findAll() {
        return List.of();
    }
}
