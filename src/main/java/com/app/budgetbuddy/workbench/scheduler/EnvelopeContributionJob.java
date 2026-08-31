package com.app.budgetbuddy.workbench.scheduler;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeNotification;
import com.app.budgetbuddy.domain.EnvelopeStatus;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeNotificationService;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeContributionEngine;
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
    private final EnvelopeContributionEngine envelopeContributionEngine;
    private final EnvelopeService envelopeService;

    @Autowired
    public EnvelopeContributionJob(EnvelopeContributionEngine envelopeContributionEngine,
                                   EnvelopeService envelopeService)
    {
        this.envelopeService = envelopeService;
        this.envelopeContributionEngine = envelopeContributionEngine;
    }

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException
    {
        JobDataMap dataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        Long envelopeId = dataMap.getLong("envelopeId");
        Envelope envelope = envelopeService.findByEnvelopeId(envelopeId)
                .orElseThrow(() -> new EnvelopeException("Envelope not found"));
        try
        {
            envelopeContributionEngine.processAutoSingleEnvelope(envelope);
        }catch(Exception e)
        {
            log.error("Error running envelope contribution job: ", e);
            throw new JobExecutionException(e);
        }
    }
}
