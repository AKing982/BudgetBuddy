package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.EnvelopeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.IntStream;

@Service
public class EnvelopeBuilderService
{
    private EnvelopeService envelopeService;
    private EnvelopePaymentPlanBuilder envelopePaymentBuilder;
    private final String ACTIVE = "ACTIVE";

    @Autowired
    public EnvelopeBuilderService(EnvelopeService envelopeService,
                                  EnvelopePaymentPlanBuilder envelopePaymentBuilder)
    {
        this.envelopeService = envelopeService;
        this.envelopePaymentBuilder = envelopePaymentBuilder;
    }

    public List<Envelope> createEnvelopes(final List<NewEnvelopeCriteria> envelopeCriteria, final List<EnvelopeCriteriaAllocations> envelopeAllocations)
    {
        if(envelopeCriteria == null || envelopeCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
        return envelopeCriteria.stream()
                .map(newEnvelopeCriteria -> {
                    LocalDate startDate = newEnvelopeCriteria.getStartDate();
                    LocalDate targetDate = newEnvelopeCriteria.getTargetDate();
                    double initialContribution = newEnvelopeCriteria.getInitialContribution();
                    long duration = ChronoUnit.MONTHS.between(startDate, targetDate);
                    BigDecimal envelopeAllocation = EnvelopeCalculations.getEnvelopeAllocation(newEnvelopeCriteria, envelopeAllocations);
                    Optional<PaymentPlan> paymentPlanOptional = envelopePaymentBuilder.build(newEnvelopeCriteria);
                    PaymentPlan paymentPlan = paymentPlanOptional.orElseThrow(() -> new RuntimeException("Payment plan could not be created"));
                    return Envelope.builder()
                            .status("ACTIVE")
                            .userId(newEnvelopeCriteria.getUserId())
                            .envelopeName(newEnvelopeCriteria.getGoalName())
                            .startDate(newEnvelopeCriteria.getStartDate())
                            .duration(Integer.parseInt(String.valueOf(duration)))
                            .targetDate(newEnvelopeCriteria.getTargetDate())
                            .envelopeType(newEnvelopeCriteria.getEnvelopeType())
                            .targetAmount(BigDecimal.valueOf(newEnvelopeCriteria.getTargetAmount()))
                            .isActive(true)
                            .currentSaved(BigDecimal.valueOf(initialContribution))
                            .budgeted(envelopeAllocation)
                            .paymentPlan(paymentPlan)
                            .build();
                })
                .toList();
    }

    public List<EnvelopeContribution> createEnvelopeContributions(final List<Envelope> envelopes, final BudgetCriteria budgetCriteria)
    {
        if(envelopes == null || envelopes.isEmpty())
        {
            return Collections.emptyList();
        }
        return envelopes.stream()
                .map(envelope -> {
                    List<Contributions> contributions = new ArrayList<>();
                    EnvelopeType envelopeType = envelope.getEnvelopeType();
                    Contributions contribution = new Contributions();
                    switch(envelopeType){
                        case PURCHASE:
                            // The purchase envelope will only have a single contribution in the list
                            // which is based on the date the user wants to pay the purchase amount on the envelope
                            // Frequency will be once
                            contribution.setAmount(envelope.getTargetAmount().doubleValue());
                            contribution.setFrequency("ONCE");
                            contribution.setStatus(ACTIVE);
                            contribution.setContributionDate(envelope.getTargetDate());
                            contributions.add(contribution);
                        case FUND:
                            // For fund envelopes, the contributions will be based on the specified frequency
                            // and the target date will be the date the user wants to pay the fund amount on the envelope
                            LocalDate startDate = envelope.getStartDate();
                            String frequency = envelope.getFrequency();
                            BigDecimal amount = envelope.getBudgeted();
                            IntStream.range(0, envelope.getDuration())
                                    .forEach(i ->
                                    {
                                        LocalDate contributionDate = switch (frequency)
                                        {
                                            case "WEEKLY"  -> startDate.plusWeeks(i);
                                            case "MONTHLY" -> startDate.plusMonths(i);
                                            default        -> startDate.plusMonths(i);
                                        };
                                        contributions.add(Contributions.builder()
                                                .amount(amount.doubleValue())
                                                .frequency(frequency)
                                                .status("ACTIVE")
                                                .contributionDate(contributionDate)
                                                .build());
                                    });
                        case PAYOFF:
                            PaymentPlan paymentPlan = envelope.getPaymentPlan();
                            List<PaymentSchedule> paymentSchedules = paymentPlan.getPaymentSchedules();
                            paymentSchedules.forEach(paymentSchedule -> {
                                Contributions contribution1 = Contributions.builder()
                                        .amount(paymentSchedule.getAmount().doubleValue())
                                        .status("ACTIVE")
                                        .contributionDate(paymentSchedule.getDueDate())
                                        .build();
                                contributions.add(contribution1);
                            });
                    }
                    return EnvelopeContribution.builder()
                            .envelope(envelope)
                            .contributions(contributions)
                            .build();
                })
                .toList();
    }

}
