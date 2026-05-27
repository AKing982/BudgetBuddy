package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.EnvelopeContributionsEntity;
import com.app.budgetbuddy.repositories.EnvelopeContributionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class EnvelopeContributionsServiceImpl implements EnvelopeContributionsService
{
    private final EnvelopeContributionsRepository envelopeContributionsRepository;

    @Autowired
    public EnvelopeContributionsServiceImpl(EnvelopeContributionsRepository envelopeContributionsRepository)
    {
        this.envelopeContributionsRepository = envelopeContributionsRepository;
    }

    @Override
    public Collection<EnvelopeContributionsEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(EnvelopeContributionsEntity envelopeContributionsEntity) {

    }

    @Override
    public void delete(EnvelopeContributionsEntity envelopeContributionsEntity) {

    }

    @Override
    public Optional<EnvelopeContributionsEntity> findById(Long id) {
        return Optional.empty();
    }
}
