package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.EnvelopeLinkNotification;
import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.entities.EnvelopeNotificationsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.EnvelopeNotificationRepository;
import com.app.budgetbuddy.workbench.converter.EnvelopeNotificationToEntityConverter;
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
public class EnvelopeNotificationServiceImpl implements EnvelopeNotificationService
{
    private final EnvelopeNotificationRepository envelopeNotificationRepository;
    private final EnvelopeNotificationToEntityConverter envelopeNotificationToEntityConverter;

    @Autowired
    public EnvelopeNotificationServiceImpl(EnvelopeNotificationRepository envelopeNotificationRepository,
                                           EnvelopeNotificationToEntityConverter envelopeNotificationToEntityConverter)
    {
        this.envelopeNotificationRepository = envelopeNotificationRepository;
        this.envelopeNotificationToEntityConverter = envelopeNotificationToEntityConverter;
    }

    @Override
    @Transactional
    public Collection<EnvelopeNotificationsEntity> findAll()
    {
        try
        {
            return envelopeNotificationRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the envelope notifications", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(EnvelopeNotificationsEntity envelopeNotificationsEntity)
    {
        try
        {
            envelopeNotificationRepository.save(envelopeNotificationsEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the envelope notification", e);
            return;
        }
    }

    @Override
    @Transactional
    public void delete(EnvelopeNotificationsEntity envelopeNotificationsEntity)
    {
        try
        {
            envelopeNotificationRepository.delete(envelopeNotificationsEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the envelope notification", e);
            return;
        }
    }

    @Override
    public Optional<EnvelopeNotificationsEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public Optional<EnvelopeNotification> createAndSave(final EnvelopeNotification envelopeNotification)
    {
        if(envelopeNotification == null)
        {
            return Optional.empty();
        }
        try
        {
            EnvelopeNotificationsEntity envelopeNotificationsEntity = envelopeNotificationToEntityConverter.convert(envelopeNotification);
            EnvelopeNotificationsEntity savedEntity = envelopeNotificationRepository.save(envelopeNotificationsEntity);
            envelopeNotification.setId(savedEntity.getId());
            return Optional.of(envelopeNotification);
        }catch(DataAccessException e){
            log.error("There was an error creating and saving the envelope notification: ", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public List<EnvelopeNotification> createAndSave(final List<EnvelopeNotification> envelopeNotifications)
    {
        if(envelopeNotifications == null)
        {
            return Collections.emptyList();
        }
        try
        {
            envelopeNotifications.forEach(envelopeNotification ->
                    envelopeNotificationRepository.save(envelopeNotificationToEntityConverter.convert(envelopeNotification)));
            return envelopeNotifications;
        }catch(DataAccessException e){
            log.error("There was an error creating and saving the envelope notifications: ", e);
            return Collections.emptyList();
        }
    }
}
