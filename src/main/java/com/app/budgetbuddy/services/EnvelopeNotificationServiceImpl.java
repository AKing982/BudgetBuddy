package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.domain.EnvelopeNotificationStatus;
import com.app.budgetbuddy.entities.EnvelopeNotificationsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.EnvelopeNotificationRepository;
import com.app.budgetbuddy.workbench.converter.EnvelopeNotificationToEntityConverter;
import com.app.budgetbuddy.workbench.converter.EnvelopeNotificationToModelConverter;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeContributionValidator;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class EnvelopeNotificationServiceImpl implements EnvelopeNotificationService
{
    private final EnvelopeNotificationRepository envelopeNotificationRepository;
    private final EnvelopeNotificationToEntityConverter envelopeNotificationToEntityConverter;
    private final EnvelopeNotificationToModelConverter envelopeNotificationToModelConverter;

    @Autowired
    public EnvelopeNotificationServiceImpl(EnvelopeNotificationRepository envelopeNotificationRepository,
                                           EnvelopeNotificationToModelConverter envelopeNotificationToModelConverter,
                                           EnvelopeNotificationToEntityConverter envelopeNotificationToEntityConverter)
    {
        this.envelopeNotificationRepository = envelopeNotificationRepository;
        this.envelopeNotificationToModelConverter = envelopeNotificationToModelConverter;
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
            List<EnvelopeNotification> saved = new ArrayList<>();
            for(EnvelopeNotification envelopeNotification : envelopeNotifications)
            {
                boolean alreadyExists = envelopeNotificationRepository.existsByEnvelopeIdAndContributionDate(
                        envelopeNotification.getEnvelopeId(),
                        envelopeNotification.getDateToContribute()
                );
                if(alreadyExists){
                    continue;
                }
                envelopeNotificationRepository.save(envelopeNotificationToEntityConverter.convert(envelopeNotification));
                saved.add(envelopeNotification);
            }
            return saved;
        }catch(DataAccessException e){
            log.error("There was an error creating and saving the envelope notifications: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public List<EnvelopeNotification> getEnvelopeNotificationsByEnvelopeId(Long envelopeId)
    {
        try
        {
            List<EnvelopeNotificationsEntity> envelopeNotificationsEntities = envelopeNotificationRepository.findAllByEnvelopeId(envelopeId);
            return envelopeNotificationsEntities.stream()
                    .map(envelopeNotificationToModelConverter::convert)
                    .toList();
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope notifications", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public List<EnvelopeNotification> getNewAndPastDueNotifications(Long envelopeId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<EnvelopeNotificationsEntity> envelopeNotificationsEntities = envelopeNotificationRepository.findNewAndPastDueNotificationsForPeriod(envelopeId, startDate, endDate);
            if(envelopeNotificationsEntities.isEmpty())
            {
                return Collections.emptyList();
            }
            return envelopeNotificationsEntities.stream()
                    .map(envelopeNotificationToModelConverter::convert)
                    .toList();
        }catch(DataAccessException e){
            log.error("There was an error retrieving the envelope notifications", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public Optional<EnvelopeNotificationStatus> sendEnvelopeAcceptedNotification(Long notificationId)
    {
        try
        {
            envelopeNotificationRepository.updateEnvelopeNotificationAccepted(notificationId);
            log.info("Envelope accepted notification sent successfully");
            Optional<EnvelopeNotificationsEntity> envelopeNotificationOptional = envelopeNotificationRepository.findById(notificationId);
            if(envelopeNotificationOptional.isEmpty())
            {
                return Optional.empty();
            }
            EnvelopeNotificationStatus notificationStatus = EnvelopeNotificationStatus.builder()
                    .isRead(true)
                    .isAccepted(true)
                    .status("Envelope Notification " + notificationId + " was accepted")
                    .notificationId(notificationId)
                    .build();
            return Optional.of(notificationStatus);
        }catch(DataAccessException e){
            log.error("There was an error sending the envelope accepted notification", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public void updateNotificationReadStatus(boolean readStatus, Long notificationId)
    {
        try
        {
            envelopeNotificationRepository.updateEnvelopeNotificationStatus(notificationId, readStatus);
            log.info("Envelope notification read status updated successfully");
        }catch(DataAccessException e){
            log.error("There was an error updating the envelope notification read status", e);
        }
    }
}
