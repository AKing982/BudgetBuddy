package com.app.budgetbuddy.workbench.scheduler;

import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeLink;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import com.app.budgetbuddy.workbench.envelopes.EnvelopeContributionEngine;
import lombok.extern.slf4j.Slf4j;
import org.quartz.Job;
import org.quartz.JobDataMap;
import org.quartz.JobExecutionContext;
import org.quartz.JobExecutionException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class EnvelopeContributionJob implements Job
{
    private final EnvelopeContributionEngine envelopeContributionEngine;
    private final EnvelopeService envelopeService;
    private final LinkedEnvelopesService linkedEnvelopesService;

    @Autowired
    public EnvelopeContributionJob(EnvelopeContributionEngine envelopeContributionEngine,
                                   EnvelopeService envelopeService,
                                   LinkedEnvelopesService linkedEnvelopesService)
    {
        this.envelopeContributionEngine = envelopeContributionEngine;
        this.envelopeService = envelopeService;
        this.linkedEnvelopesService = linkedEnvelopesService;
    }

    @Override
    public void execute(JobExecutionContext jobExecutionContext) throws JobExecutionException
    {
        JobDataMap dataMap = jobExecutionContext.getJobDetail().getJobDataMap();
        String envelopeMode = dataMap.getString("envelopeMode");
        try
        {
//            if(envelopeMode.equalsIgnoreCase("SNGLE"))
//            {
//                Long envelopeId = dataMap.getLong("envelopeId");
//                Envelope envelope = envelopeService.findByEnvelopeId(envelopeId).get();
//                envelopeContributionEngine.processSingleEnvelope(envelope);
//                log.info("Envelope contribution job executed for envelope: {}", envelopeId);
//            }
//            else if(envelopeMode.equalsIgnoreCase("LINKED"))
//            {
//                Long linkedEnvelopeId = dataMap.getLong("linkedEnvelopeId");
//                EnvelopeLink envelopeLink = linkedEnvelopesService.findByLinkedEnvelopeId(linkedEnvelopeId).get();
//                envelopeContributionEngine.processLinkedEnvelope(envelopeLink);
//                log.info("Envelope contribution job executed for linked envelope: {}", linkedEnvelopeId);
//            }
        }catch(Exception e)
        {
            log.error("Error running envelope contribution job: ", e);
            throw new JobExecutionException(e);
        }
    }
}
