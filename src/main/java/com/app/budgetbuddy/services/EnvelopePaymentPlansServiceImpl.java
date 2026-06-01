package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PaymentPlan;
import com.app.budgetbuddy.entities.EnvelopePaymentPlansEntity;
import com.app.budgetbuddy.entities.PaymentPlanEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.EnvelopePaymentPlansRepository;
import com.app.budgetbuddy.workbench.converter.PaymentPlanToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EnvelopePaymentPlansServiceImpl implements EnvelopePaymentPlansService
{
    private final EnvelopePaymentPlansRepository envelopePaymentPlansRepository;
    private final PaymentPlanToEntityConverter paymentPlanToEntityConverter;

    @Autowired
    public EnvelopePaymentPlansServiceImpl(EnvelopePaymentPlansRepository envelopePaymentPlansRepository,
                                           PaymentPlanToEntityConverter paymentPlanToEntityConverter)
    {
        this.envelopePaymentPlansRepository = envelopePaymentPlansRepository;
        this.paymentPlanToEntityConverter = paymentPlanToEntityConverter;
    }

    @Override
    public Collection<EnvelopePaymentPlansEntity> findAll() {
        return List.of();
    }

    @Override
    @Transactional
    public void save(EnvelopePaymentPlansEntity envelopePaymentPlansEntity)
    {
        try
        {
            envelopePaymentPlansRepository.save(envelopePaymentPlansEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the envelope payment plan", e);
            return;
        }
    }

    @Override
    public void delete(EnvelopePaymentPlansEntity envelopePaymentPlansEntity) {

    }

    @Override
    public Optional<EnvelopePaymentPlansEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public PaymentPlan savePaymentPlan(PaymentPlan paymentPlan)
    {
        try
        {
            EnvelopePaymentPlansEntity paymentPlanEntity = paymentPlanToEntityConverter.convert(paymentPlan);
            EnvelopePaymentPlansEntity savedEntity = envelopePaymentPlansRepository.save(paymentPlanEntity);
            paymentPlan.setId(savedEntity.getId());

            return paymentPlan;
        }catch(DataAccessException e){
            log.error("There was an error saving the payment plan", e);
            return null;
        }
    }
}
