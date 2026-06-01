package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.workbench.scheduler.EnvelopeContributionJob;
import lombok.extern.slf4j.Slf4j;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

@Service
@Slf4j
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
        try
        {
            JobKey jobKey = JobKey.jobKey("envelope-job-" + envelopeId, "envelope-contributions");
            TriggerKey triggerKey = TriggerKey.triggerKey("envelope-trigger-" + envelopeId, "envelope-contributions");
            JobDetail jobDetail = JobBuilder.newJob(EnvelopeContributionJob.class)
                    .withIdentity(jobKey)
                    .usingJobData("envelopeId", envelopeId)
                    .usingJobData("envelopeMode", "SINGLE")
                    .build();
            Date triggerStartDate = Date.from(scheduledDate.atStartOfDay(ZoneId.systemDefault()).toInstant());
            Trigger trigger = TriggerBuilder.newTrigger()
                    .withIdentity(triggerKey)
                    .startAt(triggerStartDate)
                    .withSchedule(CronScheduleBuilder.cronSchedule(mapFrequencyToCron(frequency)))
                    .build();
            if(scheduler.checkExists(jobKey))
            {
                scheduler.rescheduleJob(triggerKey, trigger);
            }
            else
            {
                scheduler.scheduleJob(jobDetail, trigger);
            }
            log.info("Envelope contribution scheduled for: {}", scheduledDate);
        }catch(SchedulerException ex){
            log.error("There was an error scheduling the envelope contribution", ex);
        }
    }

    private String mapFrequencyToCron(String frequency)
    {
        return switch(frequency.toUpperCase())
        {
            case "DAILY"   -> "0 0 0 * * ?";
            case "WEEKLY"  -> "0 0 0 ? * MON";
            case "MONTHLY" -> "0 0 0 1 * ?";
            case "MANUAL"  -> "0 0 0 * * ?";
            default        -> "0 0 0 * * ?";
        };
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

    public boolean isScheduled(Long envelopeId)
    {
        try
        {
            TriggerKey triggerKey = TriggerKey.triggerKey("envelope-trigger-" + envelopeId, "envelope-contributions");
            return scheduler.checkExists(triggerKey);
        }catch(SchedulerException e){
            log.error("There was an error checking if the envelope contribution is scheduled", e);
            return false;
        }
    }
}
