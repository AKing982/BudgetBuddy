package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPColumn;
import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPColumnRepository;
import com.app.budgetbuddy.repositories.BPTemplateDetailsRepository;
import com.app.budgetbuddy.workbench.converter.BPColumnToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@Slf4j
public class BPColumnServiceImpl implements BPColumnService
{
    private final BPColumnRepository bpColumnRepository;
    private final BPTemplateDetailsRepository bpTemplateDetailsRepository;
    private final BPColumnToEntityConverter columnToEntityConverter;

    @Autowired
    public BPColumnServiceImpl(BPColumnRepository bpColumnRepository,
                               BPTemplateDetailsRepository bpTemplateDetailsRepository,
                               BPColumnToEntityConverter columnToEntityConverter)
    {
        this.bpColumnRepository = bpColumnRepository;
        this.bpTemplateDetailsRepository = bpTemplateDetailsRepository;
        this.columnToEntityConverter = columnToEntityConverter;
    }

    @Override
    @Transactional
    public Collection<BPColumnEntity> findAll()
    {
        try
        {
            return bpColumnRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the budget columns", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(BPColumnEntity bpColumnEntity)
    {
        try
        {
            bpColumnRepository.save(bpColumnEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget column", e);
            throw new DataAccessException("There was an error saving the budget column", e);
        }
    }

    @Override
    @Transactional
    public void delete(BPColumnEntity bpColumnEntity)
    {
        try
        {
            bpColumnRepository.delete(bpColumnEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the budget column", e);
            throw new DataAccessException("There was an error deleting the budget column", e);
        }
    }

    @Override
    public Optional<BPColumnEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public List<BPColumnEntity> saveColumns(List<BPColumn> columns, BPTemplateDetailEntity detail)
    {
        try
        {
            List<BPColumnEntity> columnEntities = new ArrayList<>();
            Long templateDetailId = detail.getId();
            BPTemplateDetailEntity templateDetailEntity = bpTemplateDetailsRepository.findById(templateDetailId)
                            .orElseThrow(() -> new DataAccessException("Template detail not found"));

            columns.forEach(bpColumn -> {
                BPColumnEntity columnEntity = columnToEntityConverter.convert(bpColumn);
                columnEntity.setBpTemplateDetail(templateDetailEntity);
                BPColumnEntity bpColumnEntity = bpColumnRepository.save(columnEntity);
                columnEntities.add(bpColumnEntity);
            });
            return columnEntities;
        }catch(DataAccessException e){
            log.error("There was an error saving the budget columns", e);
            throw new DataAccessException("There was an error saving the budget columns", e);
        }
    }
}
