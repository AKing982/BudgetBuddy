package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidCursor;
import com.app.budgetbuddy.entities.PlaidCursorEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.PlaidCursorException;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.repositories.PlaidCursorRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import com.app.budgetbuddy.workbench.converter.PlaidCursorToEntityConverter;
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
    private final UserRepository userRepository;
    private final PlaidCursorToEntityConverter plaidCursorToEntityConverter;

    @Autowired
    public PlaidCursorServiceImpl(PlaidCursorRepository plaidCursorRepository,
                                  UserRepository userRepository,
                                  PlaidCursorToEntityConverter plaidCursorToEntityConverter)
    {
        this.plaidCursorRepository = plaidCursorRepository;
        this.userRepository = userRepository;
        this.plaidCursorToEntityConverter = plaidCursorToEntityConverter;
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
    @Transactional
    public Optional<PlaidCursorEntity> findById(Long id)
    {
        try
        {
            return plaidCursorRepository.findById(id);
        }catch(DataAccessException e){
            log.error("There was an error fetching the plaid cursor with id {}: ", id, e);
            return Optional.empty();
        }
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
    @Transactional
    public PlaidCursorEntity findByUserAndItemId(Long userId, String itemId)
    {
        try
        {
            UserEntity userEntity = userRepository.findById(userId).orElseThrow(() -> new UserNotFoundException("User with Id " + userId + " not found"));
            Optional<PlaidCursorEntity> plaidCursorEntityOptional = plaidCursorRepository.findByUserIdAndItemId(userId, itemId);
            if(plaidCursorEntityOptional.isEmpty())
            {
                PlaidCursorEntity plaidCursorEntity = new PlaidCursorEntity();
                plaidCursorEntity.setItemId(itemId);
                plaidCursorEntity.setCursor("");
                plaidCursorEntity.setUser(userEntity);
                save(plaidCursorEntity);
                return plaidCursorRepository.findByUserIdAndItemId(userId, itemId).orElse(plaidCursorEntity);
            }
            return plaidCursorEntityOptional.get();
        }catch(DataAccessException e){
            log.error("There was an error fetching the plaid cursor by user {} and itemId {}:", userId, itemId, e);
            throw e;
        }
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
    @Transactional
    public void updateNextPlaidCursor(String cursor, Long userId, String itemId)
    {
        try
        {
            plaidCursorRepository.updatePlaidCursor(cursor, userId, itemId);
        }catch(DataAccessException e){
            log.error("There was an error updating the next plaid cursor: ", e);
            throw e;
        }
    }

    @Override
    @Transactional
    public void savePlaidCursor(PlaidCursor plaidCursor)
    {
        if(plaidCursor == null)
        {
            return;
        }
        try
        {
            PlaidCursorEntity plaidCursorEntity = plaidCursorToEntityConverter.convert(plaidCursor);
            plaidCursorRepository.save(plaidCursorEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the plaid cursor: ", e);
            return;
        }
    }
}
