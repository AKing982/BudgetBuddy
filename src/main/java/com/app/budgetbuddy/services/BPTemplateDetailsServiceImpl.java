package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPTemplateDetailsRepository;
import com.app.budgetbuddy.workbench.converter.BPTemplateDetailEntityToModelConverter;
import com.app.budgetbuddy.workbench.converter.BPTemplateDetailToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplateDetailsServiceImpl implements BPTemplateDetailsService
{
    private final BPTemplateDetailsRepository bpTemplateDetailsRepository;
    private final BPTemplateDetailToEntityConverter bpTemplateDetailToEntityConverter;
    private final BPTemplateDetailEntityToModelConverter bpTemplateDetailEntityToModelConverter;

    @Autowired
    public BPTemplateDetailsServiceImpl(BPTemplateDetailsRepository bpTemplateDetailsRepository,
                                        BPTemplateDetailToEntityConverter bpTemplateDetailToEntityConverter,
                                        BPTemplateDetailEntityToModelConverter bpTemplateDetailEntityToModelConverter)
    {
        this.bpTemplateDetailsRepository = bpTemplateDetailsRepository;
        this.bpTemplateDetailToEntityConverter = bpTemplateDetailToEntityConverter;
        this.bpTemplateDetailEntityToModelConverter = bpTemplateDetailEntityToModelConverter;
    }

    @Override
    public Collection<BPTemplateDetailEntity> findAll()
    {
        try
        {
            return bpTemplateDetailsRepository.findAll();
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving all the budget template details.", e);
            return Collections.emptyList();
        }
    }

    @Override
    public void save(BPTemplateDetailEntity bpTemplateDetailEntity)
    {
        if(bpTemplateDetailEntity == null)
        {
            return;
        }
        try
        {
            bpTemplateDetailsRepository.save(bpTemplateDetailEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the budget template detail: ", e);
            throw new DataAccessException("There was an error saving the budget template detail", e);
        }
    }

    @Override
    public void delete(BPTemplateDetailEntity bpTemplateDetailEntity)
    {
        if(bpTemplateDetailEntity == null)
        {
            return;
        }
        try
        {
            bpTemplateDetailsRepository.delete(bpTemplateDetailEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error deleting the budget template detail: ", e);
            throw new DataAccessException("There was an error deleting the budget template detail", e);
        }
    }

    @Override
    public Optional<BPTemplateDetailEntity> findById(Long id)
    {
        if(id == null || id < 1)
        {
            log.error("The id provided is invalid: {}", id);
            return Optional.empty();
        }
        try
        {
            return bpTemplateDetailsRepository.findById(id);
        }catch(DataAccessException e)
        {
            log.error("There was an error retrieving the budget template detail with id {}: ", id, e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public BPTemplateDetailEntity saveModel(BPTemplateDetail detail, BPTemplateEntity template)
    {
        try
        {
            BPTemplateDetailEntity entity = bpTemplateDetailToEntityConverter.convert(detail);
            entity.setBpTemplate(template);
            return bpTemplateDetailsRepository.save(entity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget template detail: ", e);
            throw new DataAccessException("There was an error saving the budget template detail", e);
        }
    }

    @Override
    @Transactional
    public Optional<BPTemplateDetail> findByTemplateId(Long id)
    {
        if(id == null || id < 1)
        {
            return Optional.empty();
        }
        try
        {
            BPTemplateDetailEntity entity = bpTemplateDetailsRepository.findByBpTemplateId(id);
            return Optional.of(bpTemplateDetailEntityToModelConverter.convert(entity));
        }catch(DataAccessException e){
            log.error("There was an error retrieving the budget template detail: ", e);
            return Optional.empty();
        }
    }

}
