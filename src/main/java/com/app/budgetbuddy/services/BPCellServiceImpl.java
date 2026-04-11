package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPCellEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPCellRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class BPCellServiceImpl implements BPCellService
{
    private final BPCellRepository bpCellRepository;

    @Autowired
    public BPCellServiceImpl(BPCellRepository bpCellRepository)
    {
        this.bpCellRepository = bpCellRepository;
    }

    @Override
    @Transactional
    public Collection<BPCellEntity> findAll()
    {
        try
        {
            return bpCellRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the budget cells", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(BPCellEntity bpCellEntity)
    {
        try
        {
            bpCellRepository.save(bpCellEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget cell", e);
            throw new DataAccessException("There was an error saving the budget cell", e);
        }
    }

    @Override
    @Transactional
    public void delete(BPCellEntity bpCellEntity)
    {
        try
        {
            bpCellRepository.delete(bpCellEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the budget cell", e);
            throw new DataAccessException("There was an error deleting the budget cell", e);
        }
    }

    @Override
    public Optional<BPCellEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public void updateCellAmount(Long id, Double amount)
    {
        try
        {
            bpCellRepository.updateBPCellAmount(id, amount);
        }catch(DataAccessException e){
            log.error("There was an error updating the cell amount", e);
            throw new DataAccessException("There was an error updating the cell amount", e);
        }
    }
}
