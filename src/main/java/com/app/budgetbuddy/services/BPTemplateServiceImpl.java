package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPTemplate;
import com.app.budgetbuddy.domain.BPTemplateType;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPTemplateRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import com.app.budgetbuddy.workbench.converter.BPTemplateEntityToModelConverter;
import com.app.budgetbuddy.workbench.converter.BPTemplateToEntityConverter;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
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
public class BPTemplateServiceImpl implements BPTemplateService
{
    private final BPTemplateRepository repository;
    private final UserRepository userRepository;
    private final BPTemplateToEntityConverter converter;

    @PersistenceContext
    private final EntityManager entityManager;
    private final BPTemplateEntityToModelConverter entityToModelConverter;

    @Autowired
    public BPTemplateServiceImpl(BPTemplateRepository repository,
                                 UserRepository userRepository,
                                 BPTemplateToEntityConverter converter,
                                 EntityManager entityManager,
                                 BPTemplateEntityToModelConverter entityToModelConverter)
    {
        this.repository = repository;
        this.userRepository = userRepository;
        this.converter = converter;
        this.entityManager = entityManager;
        this.entityToModelConverter = entityToModelConverter;
    }

    @Override
    @Transactional
    public Collection<BPTemplateEntity> findAll()
    {
        try
        {
            return repository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the budget templates", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(BPTemplateEntity bpTemplateEntity)
    {
        try
        {
            repository.save(bpTemplateEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget template", e);
            return;
        }
    }

    @Override
    @Transactional
    public void delete(BPTemplateEntity bpTemplateEntity)
    {
        try
        {
            repository.delete(bpTemplateEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the budget template", e);
            return;
        }
    }

    @Override
    public Optional<BPTemplateEntity> findById(Long id)
    {
        return Optional.empty();
    }

    @Override
    @Transactional
    public BPTemplateEntity saveTemplate(BPTemplate template, Long userId)
    {
        UserEntity user = userRepository.findById(userId).orElseThrow(() -> new RuntimeException("User not found"));
        try
        {
            BPTemplateEntity entity = converter.convert(template);
            entity.setUser(user);
            return repository.save(entity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget template", e);
            return null;
        }
    }

    @Override
    @Transactional
    public List<BPTemplate> getAllUserBudgetTemplates(Long userId)
    {
        try
        {
            List<BPTemplateEntity> templateEntities = repository.findByUserId(userId);
            return templateEntities.stream()
                    .map(entityToModelConverter::convert)
                    .toList();
        }catch(DataAccessException e){
            log.error("There was an error retrieving the user budget templates", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public BPTemplateType getTemplateTypeById(Long id)
    {
        try
        {
            Optional<BPTemplateType> templateType = repository.findTypeById(id);
            if(templateType.isEmpty())
            {
                throw new RuntimeException("Template type not found");
            }
            return templateType.get();
        }catch(DataAccessException e){
            log.error("There was an error retrieving the user budget templates", e);
            return null;
        }
    }

    @Override
    @Transactional
    public Optional<BPTemplate> getTemplateByUserAndId(Long userId, Long templateId)
    {
        try
        {
            entityManager.clear();
            BPTemplateEntity templateEntity = repository.findById(templateId).orElseThrow(() -> new RuntimeException("Template not found"));
            BPTemplate template = entityToModelConverter.convert(templateEntity);
            return Optional.of(template);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the user budget templates", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<BPTemplate> getUserTemplatesByType(Long userId, String templateType)
    {
        return Optional.empty();
    }
}
