package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.EnvelopeType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class EnvelopeContributionBuilderUtil
{
    public EnvelopeContributionBuilderUtil(){

    }

    public List<LocalDate> createScheduledDates(LocalDate startDate, LocalDate endDate, String frequency)
    {
        List<LocalDate> dates = new ArrayList<>();
        LocalDate cursor = startDate;
        LocalDate end = endDate != null ? endDate : startDate.plusYears(1);
        while(!cursor.isAfter(end))
        {
            dates.add(cursor);
            cursor = advanceDate(cursor, frequency);
        }
        return dates;
    }

    public BigDecimal determineMinAmount(final EnvelopeType envelopeType, final BigDecimal allocated, BigDecimal contributionAmount)
    {
        return switch(envelopeType){
            case PAYOFF -> allocated;
            case PURCHASE -> contributionAmount;
            case FUND -> BigDecimal.valueOf(1.00);
        };
    }

    public BigDecimal determineMaxAmount(final EnvelopeType envelopeType, final BigDecimal allocated, final BigDecimal contributionAmount, final BigDecimal envelopeTargetAmount)
    {
        return switch(envelopeType){
            case PAYOFF, PURCHASE -> envelopeTargetAmount;
            case FUND -> contributionAmount;
        };
    }

    public BigDecimal determineContributionAmount(final EnvelopeType envelopeType, final BigDecimal allocationAmount, final BigDecimal targetAmount, int totalPeriods)
    {
        log.info("Determining Contribution Amount for Envelope Type: {}, Allocation Amount: {}, Target Amount: {}, Total Periods: {}", envelopeType, allocationAmount, targetAmount, totalPeriods);
        return switch(envelopeType){
            case PURCHASE, PAYOFF -> allocationAmount;
            case FUND -> totalPeriods > 0
                    ? targetAmount.divide(BigDecimal.valueOf(totalPeriods), 2, RoundingMode.CEILING)
                    : targetAmount;
        };
    }

    public LocalDate advanceDate(LocalDate date, String frequency)
    {
        return switch(frequency.toUpperCase())
        {
            case "WEEKLY" -> date.plusWeeks(1);
            case "BIWEEKLY" -> date.plusWeeks(2);
            case "MONTHLY" -> date.plusMonths(1);
            default -> date.plusMonths(1);
        };
    }
}
