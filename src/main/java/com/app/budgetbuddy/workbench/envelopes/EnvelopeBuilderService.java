package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.EnvelopePaymentSchedulesEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeContributionsService;
import com.app.budgetbuddy.services.EnvelopePaymentPlansService;
import com.app.budgetbuddy.services.EnvelopePaymentSchedulesService;
import com.app.budgetbuddy.services.EnvelopeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.IntStream;

@Service
@Slf4j
public class EnvelopeBuilderService
{
    private final EnvelopeService envelopeService;
    private final EnvelopeContributionsService envelopeContributionsService;
    private final EnvelopePaymentPlansService envelopePaymentPlansService;
    private final EnvelopePaymentSchedulesService envelopePaymentSchedulesService;
    private final EnvelopeContributionBuilder envelopeContributionBuilder;
    private final EnvelopePaymentPlanBuilder envelopePaymentBuilder;
    private final String ACTIVE = "ACTIVE";

    @Autowired
    public EnvelopeBuilderService(EnvelopeService envelopeService,
                                  EnvelopeContributionsService envelopeContributionsService,
                                  EnvelopePaymentPlansService envelopePaymentPlansService,
                                  EnvelopePaymentSchedulesService envelopePaymentSchedulesService,
                                  EnvelopeContributionBuilder envelopeContributionBuilder,
                                  EnvelopePaymentPlanBuilder envelopePaymentBuilder)
    {
        this.envelopeService = envelopeService;
        this.envelopeContributionsService = envelopeContributionsService;
        this.envelopeContributionBuilder = envelopeContributionBuilder;
        this.envelopePaymentPlansService = envelopePaymentPlansService;
        this.envelopePaymentSchedulesService = envelopePaymentSchedulesService;
        this.envelopePaymentBuilder = envelopePaymentBuilder;
    }

    public Envelope createSingleEnvelope(final NewEnvelopeCriteria newEnvelopeCriteria, final BudgetCriteria budgetCriteria, final List<SubBudget> subBudgets)
    {
        if(newEnvelopeCriteria == null || budgetCriteria == null)
        {
            throw new IllegalArgumentException("NewEnvelopeCriteria and BudgetCriteria cannot be null");
        }
        LocalDate startDate = newEnvelopeCriteria.getStartDate();
        LocalDate targetDate = newEnvelopeCriteria.getTargetDate();
        double initialContribution = newEnvelopeCriteria.getInitialContribution();
        BigDecimal targetAmount = BigDecimal.valueOf(newEnvelopeCriteria.getTargetAmount());
        long duration = ChronoUnit.MONTHS.between(startDate, targetDate);
        BigDecimal envelopeAllocation = EnvelopeCalculations.calculateEnvelopeAllocation(newEnvelopeCriteria,budgetCriteria);
        EnvelopeType envelopeType = newEnvelopeCriteria.getEnvelopeType();
        PaymentPlan paymentPlan;
        String frequency = newEnvelopeCriteria.getFrequency();
        Envelope envelope = Envelope.builder()
                .status("ACTIVE")
                .userId(newEnvelopeCriteria.getUserId())
                .envelopeName(newEnvelopeCriteria.getGoalName())
                .startDate(newEnvelopeCriteria.getStartDate())
                .frequency(frequency)
                .duration(Integer.parseInt(String.valueOf(duration)))
                .targetDate(newEnvelopeCriteria.getTargetDate())
                .envelopeType(newEnvelopeCriteria.getEnvelopeType())
                .targetAmount(BigDecimal.valueOf(newEnvelopeCriteria.getTargetAmount()))
                .isActive(true)
                .currentSaved(BigDecimal.valueOf(initialContribution))
                .budgeted(envelopeAllocation)
                .contributions(null)
                .paymentPlan(null)
                .build();

        Envelope savedEnvelope = envelopeService.save(envelope);
        if(envelopeType == EnvelopeType.PAYOFF)
        {
            Optional<PaymentPlan> paymentPlanOptional = envelopePaymentBuilder.build(newEnvelopeCriteria);
            paymentPlan = paymentPlanOptional.orElseThrow(() -> new RuntimeException("Payment plan could not be created"));
            paymentPlan.setEnvelopeId(envelope.getId());
            PaymentPlan savedPaymentPlan = envelopePaymentPlansService.savePaymentPlan(paymentPlan);
            savedEnvelope.setPaymentPlan(savedPaymentPlan);

            // Create the envelope payment schedules
            List<PaymentSchedule> paymentSchedules = createPaymentSchedules(paymentPlan);
            envelopePaymentSchedulesService.savePaymentSchedules(paymentSchedules);
        }
        // Generate the contributions for the envelope
        List<Contributions> contributions = envelopeContributionBuilder.build(targetDate, startDate, envelopeType,frequency,targetAmount, envelopeAllocation);
        log.info("Contributions: {}", contributions);

        // Save the contributions to the database
        EnvelopeContribution envelopeContribution = EnvelopeContribution.builder()
                .envelope(savedEnvelope)
                .contributions(contributions)
                .build();

        // Attach the contributions to the envelope and save the envelope again
        List<EnvelopeContribution> savedContributions = envelopeContributionsService.saveContributions(List.of(envelopeContribution));
        log.info("Saved Contributions: {}", savedContributions);
        savedEnvelope.setSubBudgets(subBudgets);

        envelopeService.save(savedEnvelope);
        savedEnvelope.setContributions(savedContributions.get(0).getContributions());
        return savedEnvelope;
    }

    List<PaymentSchedule> createPaymentSchedules(final PaymentPlan paymentPlan)
    {
        if(paymentPlan == null)
        {
            throw new EnvelopeException("Payment plan cannot be null");
        }
        log.info("Payment Plan: {}", paymentPlan);
        Long paymentPlanId = paymentPlan.getId();
        List<PaymentSchedule> paymentSchedules = new ArrayList<>();
        int totalPayments = paymentPlan.getTotalPayments();
        LocalDate initialPaymentDate = paymentPlan.getInitialPaymentDate();
        LocalDate dueDate = paymentPlan.getDueDate();
        BigDecimal originalBalance = paymentPlan.getOriginalBalance();
        BigDecimal currentPaid = paymentPlan.getCurrentPaid();
        boolean isPayInFour = paymentPlan.isPayInFour();
        BigDecimal remainingBalance = originalBalance.subtract(currentPaid);
        PaymentSchedule paymentSchedule;
        if(isPayInFour && totalPayments == 4)
        {
            LocalDate firstPaymentDate = initialPaymentDate;
            while(!firstPaymentDate.isAfter(dueDate))
            {
                firstPaymentDate = firstPaymentDate.plusWeeks(2);
                remainingBalance = remainingBalance.subtract(paymentPlan.getMinimumPayment());
                paymentSchedule = PaymentSchedule.builder()
                        .paymentPlanId(paymentPlanId)
                        .dueDate(firstPaymentDate)
                        .amount(paymentPlan.getMinimumPayment())
                        .balance(remainingBalance)
                        .status("PENDING")
                        .build();
                paymentSchedules.add(paymentSchedule);
            }
        }
        else
        {
            LocalDate paymentDate = initialPaymentDate;
            for(int i = 0; i < totalPayments; i++)
            {
                remainingBalance = remainingBalance.subtract(paymentPlan.getMinimumPayment());
                paymentSchedule = PaymentSchedule.builder()
                        .paymentPlanId(paymentPlanId)
                        .dueDate(paymentDate)
                        .amount(paymentPlan.getMinimumPayment())
                        .balance(remainingBalance)
                        .status("PENDING")
                        .build();
                paymentDate = paymentDate.plusMonths(1);
                paymentSchedules.add(paymentSchedule);
            }
        }
        return paymentSchedules;
    }

    public List<Envelope> createEnvelopes(final List<NewEnvelopeCriteria> envelopeCriteria, final BudgetCriteria budgetCriteria, final List<SubBudget> subBudgets, final boolean isLinked)
    {
        if(envelopeCriteria == null || envelopeCriteria.isEmpty())
        {
            return Collections.emptyList();
        }
        return envelopeCriteria.stream()
                .map(criteria -> {
                    Envelope envelope = createSingleEnvelope(criteria, budgetCriteria, subBudgets);
                    envelope.setLinked(isLinked);
                    return envelope;
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
                    String frequency = envelope.getFrequency();
                    switch(envelopeType){
                        case PURCHASE:
                            // The purchase envelope will only have a single contribution in the list
                            // which is based on the date the user wants to pay the purchase amount on the envelope
                            // Frequency will be once
                            Contributions contribution = Contributions.builder()
                                    .amount(envelope.getTargetAmount().doubleValue())
                                    .frequency("ONCE")
                                    .status(ACTIVE)
                                    .scheduledDate(envelope.getTargetDate())
                                    .contributionDate(envelope.getTargetDate())
                                    .build();
                            contributions.add(contribution);
                            break;
                        case FUND:
                            // For fund envelopes, the contributions will be based on the specified frequency
                            // and the target date will be the date the user wants to pay the fund amount on the envelope
                            LocalDate startDate = envelope.getStartDate();
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
                                                .scheduledDate(contributionDate)
                                                .build());
                                    });
                            break;
                        case PAYOFF:
                            PaymentPlan paymentPlan = envelope.getPaymentPlan();
                            if(paymentPlan == null)
                            {
                                break;
                            }
                            List<PaymentSchedule> paymentSchedules = paymentPlan.getPaymentSchedules();
                            if(paymentSchedules == null || paymentSchedules.isEmpty())
                            {
                                break;
                            }
                            paymentSchedules.forEach(paymentSchedule -> {
                                Contributions contribution1 = Contributions.builder()
                                        .amount(paymentSchedule.getAmount().doubleValue())
                                        .status("ACTIVE")
                                        .contributionDate(paymentSchedule.getDueDate())
                                        .scheduledDate(paymentSchedule.getDueDate())
                                        .frequency(frequency)
                                        .build();
                                contributions.add(contribution1);
                            });
                            break;
                    }
                    return EnvelopeContribution.builder()
                            .envelope(envelope)
                            .contributions(contributions)
                            .build();
                })
                .toList();
    }

}
