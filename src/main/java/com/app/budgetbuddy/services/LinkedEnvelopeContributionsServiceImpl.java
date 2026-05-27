package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.LinkedEnvelopeContributionsEntity;
import com.app.budgetbuddy.repositories.LinkedEnvelopeContributionsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class LinkedEnvelopeContributionsServiceImpl implements LinkedEnvelopeContributionsService
{
    private final LinkedEnvelopeContributionsRepository linkedEnvelopeContributionsRepository;

    @Autowired
    public LinkedEnvelopeContributionsServiceImpl(LinkedEnvelopeContributionsRepository linkedEnvelopeContributionsRepository)
    {
        this.linkedEnvelopeContributionsRepository = linkedEnvelopeContributionsRepository;
    }

    @Override
    public Collection<LinkedEnvelopeContributionsEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(LinkedEnvelopeContributionsEntity linkedEnvelopeContributionsEntity) {

    }

    @Override
    public void delete(LinkedEnvelopeContributionsEntity linkedEnvelopeContributionsEntity) {

    }

    @Override
    public Optional<LinkedEnvelopeContributionsEntity> findById(Long id) {
        return Optional.empty();
    }
}
