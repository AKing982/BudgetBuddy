package com.app.budgetbuddy.workbench.envelopes;

import org.quartz.Scheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Service
public class EnvelopeContributionScheduler
{
    private final Scheduler scheduler;

    @Autowired
    public EnvelopeContributionScheduler(Scheduler scheduler)
    {
        this.scheduler = scheduler;
    }

    public void scheduleEnvelopeContribution(Long envelopeId,
                                             LocalDate scheduledDate,
                                             String frequency)
    {

    }

    public void unscheduleEnvelopeContribution(Long envelopeId)
    {

    }

    public void resumeEnvelopeContribution(Long envelopeId)
    {

    }

    public void pauseEnvelopeContribution(Long envelopeId)
    {

    }

    public void customSchedule(Long envelopeId,
                               LocalDate scheduledDate,
                               String cronExpression)
    {

    }

    public boolean isScheduled(Long envelopeId)
    {
        return false;
    }
}
