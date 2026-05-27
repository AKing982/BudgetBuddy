package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.EnvelopePaymentPlansEntity;
import com.app.budgetbuddy.repositories.EnvelopePaymentPlansRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class EnvelopePaymentPlansServiceImpl implements EnvelopePaymentPlansService
{
    private final EnvelopePaymentPlansRepository envelopePaymentPlansRepository;

    @Autowired
    public EnvelopePaymentPlansServiceImpl(EnvelopePaymentPlansRepository envelopePaymentPlansRepository)
    {
        this.envelopePaymentPlansRepository = envelopePaymentPlansRepository;
    }

    @Override
    public Collection<EnvelopePaymentPlansEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(EnvelopePaymentPlansEntity envelopePaymentPlansEntity) {

    }

    @Override
    public void delete(EnvelopePaymentPlansEntity envelopePaymentPlansEntity) {

    }

    @Override
    public Optional<EnvelopePaymentPlansEntity> findById(Long id) {
        return Optional.empty();
    }
}
