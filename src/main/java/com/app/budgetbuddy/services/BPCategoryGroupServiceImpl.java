package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPCategoryGroupEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPCategoryGroupRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Slf4j
public class BPCategoryGroupServiceImpl implements BPCategoryGroupService
{
    private final BPCategoryGroupRepository bpCategoryGroupRepository;

    @Autowired
    public BPCategoryGroupServiceImpl(BPCategoryGroupRepository bpCategoryGroupRepository)
    {
        this.bpCategoryGroupRepository = bpCategoryGroupRepository;
    }

    @Override
    @Transactional
    public Collection<BPCategoryGroupEntity> findAll()
    {
        try
        {
            return bpCategoryGroupRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the category groups", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(BPCategoryGroupEntity bpCategoryGroupEntity)
    {
        try
        {
            bpCategoryGroupRepository.save(bpCategoryGroupEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the category group: ", e);
            throw new DataAccessException("There was an error saving the category group", e);
        }
    }

    @Override
    @Transactional
    public void delete(BPCategoryGroupEntity bpCategoryGroupEntity)
    {
        try
        {
            bpCategoryGroupRepository.delete(bpCategoryGroupEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the category group: ", e);
            throw new DataAccessException("There was an error deleting the category group", e);
        }
    }

    @Override
    public Optional<BPCategoryGroupEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public List<BPCategoryGroupEntity> findByTemplateDetailId(Long templateDetailId)
    {
        if(templateDetailId == null)
        {
            return Collections.emptyList();
        }
        try
        {
            return bpCategoryGroupRepository.findByBpTemplateDetailId(templateDetailId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the category groups for the template detail: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public List<BPCategoryGroupEntity> findCategoryGroupsByTemplateDetailIdAndUserId(Long templateDetailId, Long userId)
    {
        if(templateDetailId == null || userId == null)
        {
            return Collections.emptyList();
        }
        try
        {
            return bpCategoryGroupRepository.findByBpTemplateDetailIdAndUserId(templateDetailId, userId);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the category groups for the template detail: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public Optional<BPCategoryGroupEntity> findByTemplateDetailIdAndName(Long templateDetailId, String name)
    {
        return Optional.empty();
    }
}
