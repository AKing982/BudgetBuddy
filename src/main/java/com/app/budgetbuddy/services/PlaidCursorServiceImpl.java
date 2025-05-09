package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidCursorEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.PlaidCursorRepository;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@Getter
@Setter
public class PlaidCursorServiceImpl implements PlaidCursorService
{
    private final PlaidCursorRepository plaidCursorRepository;

    @Autowired
    public PlaidCursorServiceImpl(PlaidCursorRepository plaidCursorRepository)
    {
        this.plaidCursorRepository = plaidCursorRepository;
    }

    @Override
    @Transactional
    public Collection<PlaidCursorEntity> findAll()
    {
        try
        {
            return plaidCursorRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the plaid cursors: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(PlaidCursorEntity plaidCursorEntity)
    {
        try
        {
            plaidCursorRepository.save(plaidCursorEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the plaid cursor: ", e);
        }
    }

    @Override
    public void delete(PlaidCursorEntity plaidCursorEntity)
    {
        try
        {
            plaidCursorRepository.delete(plaidCursorEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the plaid cursor: ", e);
        }
    }

    @Override
    public Optional<PlaidCursorEntity> findById(Long id)
    {
        return Optional.empty();
    }

    @Override
    public Optional<PlaidCursorEntity> findByItemId(String itemId)
    {
        try
        {
            return plaidCursorRepository.findByItemId(itemId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the plaid cursor: ", e);
            return Optional.empty();
        }
    }

    @Override
    public List<PlaidCursorEntity> findByUser(UserEntity user) {
        return List.of();
    }

    @Override
    public List<PlaidCursorEntity> findByUserId(Long userId)
    {
        try
        {
            return plaidCursorRepository.findByUserId(userId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the plaid cursor: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public Optional<PlaidCursorEntity> findByUserIdAndItemId(Long userId, String itemId)
    {
        try
        {
            return plaidCursorRepository.findByUserIdAndItemId(userId, itemId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the plaid cursor: ", e);
            return Optional.empty();
        }
    }

    @Override
    public PlaidCursorEntity updateSyncStatus(Long cursorId, boolean successful, String status, String errorMessage) {
        return null;
    }

    @Override
    public PlaidCursorEntity updateLastSyncTimestamp(Long cursorId, LocalDateTime timestamp) {
        return null;
    }

    @Override
    public List<PlaidCursorEntity> findCursorsNeedingSync() {
        return List.of();
    }

    @Override
    public void deleteCursorByItemId(String itemId) {

    }
}
