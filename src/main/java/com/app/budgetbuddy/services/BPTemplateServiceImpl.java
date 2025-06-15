package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.repositories.BPTemplateRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class BPTemplateServiceImpl implements BPTemplateService
{
    private final BPTemplateRepository repository;

    @Autowired
    public BPTemplateServiceImpl(BPTemplateRepository repository)
    {
        this.repository = repository;
    }

    @Override
    public Collection<BPTemplateEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BPTemplateEntity bpTemplateEntity) {

    }

    @Override
    public void delete(BPTemplateEntity bpTemplateEntity) {

    }

    @Override
    public Optional<BPTemplateEntity> findById(Long id) {
        return Optional.empty();
    }
}
