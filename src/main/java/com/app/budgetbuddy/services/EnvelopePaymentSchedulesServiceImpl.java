package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PaymentSchedule;
import com.app.budgetbuddy.entities.EnvelopePaymentSchedulesEntity;
import com.app.budgetbuddy.entities.PaymentScheduleEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.EnvelopePaymentSchedulesRepository;
import com.app.budgetbuddy.workbench.converter.PaymentScheduleToEntityConverter;
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
public class EnvelopePaymentSchedulesServiceImpl implements EnvelopePaymentSchedulesService
{
    private final EnvelopePaymentSchedulesRepository envelopePaymentSchedulesRepository;
    private final PaymentScheduleToEntityConverter paymentScheduleToEntityConverter;

    @Autowired
    public EnvelopePaymentSchedulesServiceImpl(EnvelopePaymentSchedulesRepository envelopePaymentSchedulesRepository,
                                               PaymentScheduleToEntityConverter paymentScheduleToEntityConverter)
    {
        this.envelopePaymentSchedulesRepository = envelopePaymentSchedulesRepository;
        this.paymentScheduleToEntityConverter = paymentScheduleToEntityConverter;
    }

    @Override
    @Transactional
    public Collection<EnvelopePaymentSchedulesEntity> findAll()
    {
        try
        {
            return envelopePaymentSchedulesRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the envelope payment schedules", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(EnvelopePaymentSchedulesEntity envelopePaymentSchedulesEntity)
    {
        try
        {
            envelopePaymentSchedulesRepository.save(envelopePaymentSchedulesEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the envelope payment schedule", e);
            throw new DataAccessException("There was an error saving the envelope payment schedule", e);
        }
    }

    @Override
    @Transactional
    public void delete(EnvelopePaymentSchedulesEntity envelopePaymentSchedulesEntity)
    {
        try
        {
            envelopePaymentSchedulesRepository.delete(envelopePaymentSchedulesEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the envelope payment schedule", e);
            throw new DataAccessException("There was an error deleting the envelope payment schedule", e);
        }
    }

    @Override
    @Transactional
    public Optional<EnvelopePaymentSchedulesEntity> findById(Long id)
    {
        try
        {
            return envelopePaymentSchedulesRepository.findById(id);
        }catch(DataAccessException e) {
            log.error("There was an error retrieving the envelope payment schedule", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public List<EnvelopePaymentSchedulesEntity> savePaymentSchedules(List<PaymentSchedule> paymentSchedules)
    {
        if(paymentSchedules == null || paymentSchedules.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<EnvelopePaymentSchedulesEntity> paymentScheduleEntities = paymentSchedules.stream()
                    .map(paymentScheduleToEntityConverter::convert)
                    .toList();

            envelopePaymentSchedulesRepository.saveAll(paymentScheduleEntities);
            return paymentScheduleEntities;
        }catch(DataAccessException e) {
            log.error("There was an error saving the payment schedules", e);
            return Collections.emptyList();
        }
    }
}
