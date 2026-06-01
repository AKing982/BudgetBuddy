package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.Contributions;
import com.app.budgetbuddy.domain.EnvelopeType;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class EnvelopeContributionBuilder
{
    private final EnvelopeContributionBuilderUtil envelopeContributionBuilderUtil;

    @Autowired
    public EnvelopeContributionBuilder(EnvelopeContributionBuilderUtil envelopeContributionBuilderUtil)
    {
       this.envelopeContributionBuilderUtil = envelopeContributionBuilderUtil;
    }

    public List<Contributions> build(final LocalDate envelopeTargetDate, final LocalDate envelopeStartDate, final EnvelopeType envelopeType, final String frequency, final BigDecimal envelopeTargetAmount, final BigDecimal envelopeAllocation)
    {
        if(envelopeTargetDate == null || envelopeStartDate == null || envelopeType == null || envelopeTargetAmount == null)
        {
            return Collections.emptyList();
        }
        List<LocalDate> scheduledDates = envelopeContributionBuilderUtil.createScheduledDates(envelopeStartDate, envelopeTargetDate, frequency);
        BigDecimal contributionAmount = envelopeContributionBuilderUtil.determineContributionAmount(envelopeType, envelopeAllocation, envelopeTargetAmount, scheduledDates.size());
        BigDecimal minAmount = envelopeContributionBuilderUtil.determineMinAmount(envelopeType, envelopeAllocation, contributionAmount);
        BigDecimal maxAmount = envelopeContributionBuilderUtil.determineMaxAmount(envelopeType, envelopeAllocation, contributionAmount, envelopeTargetAmount);
        return scheduledDates.stream()
                .map(date -> Contributions.builder()
                        .scheduledDate(date)
                        .contributionDate(null)
                        .amount(contributionAmount.doubleValue())
                        .status("SCHEDULED")
                        .frequency(frequency)
                        .maxAmount(maxAmount.doubleValue())
                        .minAmount(minAmount.doubleValue())
                        .build())
                .collect(Collectors.toList());
    }


}
