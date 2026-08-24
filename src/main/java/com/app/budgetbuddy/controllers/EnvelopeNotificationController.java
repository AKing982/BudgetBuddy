package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.domain.EnvelopeNotificationStatus;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.EnvelopeNotificationService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeNotificationBuilder;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/envelope-notifications")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class EnvelopeNotificationController
{
    private final EnvelopeNotificationService envelopeNotificationService;
    private final EnvelopeNotificationBuilder envelopeNotificationBuilder;

    @Autowired
    public EnvelopeNotificationController(EnvelopeNotificationService envelopeNotificationService,
                                          EnvelopeNotificationBuilder envelopeNotificationBuilder)
    {
        this.envelopeNotificationService = envelopeNotificationService;
        this.envelopeNotificationBuilder = envelopeNotificationBuilder;
    }

    @GetMapping("/check-for-new-and-past-due")
    public ResponseEntity<Boolean> checkForNewAndPastDueNotifications(@RequestParam Long envelopeId,
                                                                      @RequestParam LocalDate startDate,
                                                                      @RequestParam LocalDate endDate)
    {
        try
        {
            List<EnvelopeNotification> envelopeNotifications = envelopeNotificationService.getNewAndPastDueNotifications(envelopeId, startDate, endDate);
            if(!envelopeNotifications.isEmpty())
            {
                return ResponseEntity.ok(true);
            }
            return ResponseEntity.ok(false);
        }catch(DataException e){
            log.error("Error while checking for new and past due notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }


    @PostMapping("/create-notifications/")
    public ResponseEntity<List<EnvelopeNotification>> createEnvelopeNotifications(@RequestParam Long envelopeId,
                                                                                  @RequestParam LocalDate startDate,
                                                                                  @RequestParam LocalDate endDate)
    {
       try
       {
           // if so, return no content
           // Otherwise, create the envelope notifications and return them
           return ResponseEntity.ok(new ArrayList<>());

       }catch(DataException e){
           log.error("Error while creating envelope notifications", e);
           return ResponseEntity.internalServerError().build();
       }

    }

    @GetMapping("/by-envelope/{id}")
    public ResponseEntity<List<EnvelopeNotification>> getEnvelopeNotifications(@PathVariable Long id)
    {
        try
        {
            List<EnvelopeNotification> envelopeNotifications = envelopeNotificationService.getEnvelopeNotificationsByEnvelopeId(id);
            return ResponseEntity.ok(envelopeNotifications);
        }catch(DataException e){
            log.error("Error while getting envelope notifications", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/send-accept/")
    public ResponseEntity<EnvelopeNotificationStatus> sendEnvelopeNotificationAccept(@RequestParam Long notificationId)
    {
        try
        {
            EnvelopeNotificationStatus status = envelopeNotificationService.sendEnvelopeAcceptedNotification(notificationId).get();
            return ResponseEntity.ok(status);
        }catch(DataException e){
            log.error("Error while sending envelope notification accept", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/update-is-read/{envelopeNotificationId}")
    public ResponseEntity<Void> updateEnvelopeNotificationReadStatus(@PathVariable Long envelopeNotificationId,
                                                                     @RequestParam boolean isRead)
    {
        try
        {
            envelopeNotificationService.updateNotificationReadStatus(isRead, envelopeNotificationId);
            return ResponseEntity.ok().build();
        }catch(DataException e){
            log.error("Error while updating envelope notification read status", e);
            return ResponseEntity.internalServerError().build();
        }
    }


}
