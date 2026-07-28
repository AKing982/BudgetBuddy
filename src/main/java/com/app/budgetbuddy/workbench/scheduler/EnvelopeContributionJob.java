package com.app.budgetbuddy.workbench.scheduler;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.domain.EnvelopeStatus;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeNotificationService;
import com.app.budgetbuddy.services.EnvelopeService;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Component
@Slf4j
public class EnvelopeContributionJob implements Job
{
    private final EnvelopeNotificationService envelopeNotificationService;
    private final EnvelopeService envelopeService;

    @Autowired
    public EnvelopeContributionJob(EnvelopeNotificationService envelopeNotificationService,
                                   EnvelopeService envelopeService)
    {
        this.envelopeNotificationService = envelopeNotificationService;
        this.envelopeService = envelopeService;
    }

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException
    {
        JobDataMap dataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        Long envelopeId = dataMap.getLong("envelopeId");
        Optional<Envelope> envelopeOptional = envelopeService.findByEnvelopeId(envelopeId);
        Envelope envelope = envelopeOptional.orElseThrow(() -> new EnvelopeException("Envelope not found"));
        LocalDate scheduledContributionDate = LocalDate.parse(dataMap.getString("scheduled_date"));
        BigDecimal scheduled_amount = BigDecimal.valueOf(dataMap.getFloat("scheduled_amount"));
        try
        {
            final String title = "Envelope Contribution Notification";
            final String message = "Contribution for envelope " + envelope.getEnvelopeName() + " is due on " + scheduledContributionDate + ".";
            EnvelopeNotification notification = EnvelopeNotification.builder()
                    .dateToContribute(scheduledContributionDate)
                    .envelopeStatus(EnvelopeStatus.PENDING)
                    .envelopeName(envelope.getEnvelopeName())
                    .envelopeId(envelopeId)
                    .message(message)
                    .isRead(false)
                    .title(title)
                    .amount(scheduled_amount)
                    .envelopeType(envelope.getEnvelopeType())
                    .build();
            envelopeNotificationService.createAndSave(notification);

        }catch(Exception e)
        {
            log.error("Error running envelope contribution job: ", e);
            throw new JobExecutionException(e);
        }
    }
}
