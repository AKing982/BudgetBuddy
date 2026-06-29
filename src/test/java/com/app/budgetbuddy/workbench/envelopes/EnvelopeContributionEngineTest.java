package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.EnvelopeContributionHistoryService;
import com.app.budgetbuddy.services.EnvelopeContributionsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class EnvelopeContributionEngineTest
{
    @Mock
    private EnvelopeContributionHistoryService envelopeContributionHistoryService;

    @Mock
    private EnvelopeNotificationBuilder envelopeNotificationService;

    @Mock
    private EnvelopeContributionScheduler envelopeContributionScheduler;

    @Mock
    private EnvelopeContributionsService envelopeContributionsService;

    @InjectMocks
    private EnvelopeContributionEngine envelopeContributionEngine;


    @Test
    void testProcessManualSingleEnvelope_whenManualEntryIsNull_thenReturnEmptyOptional(){
        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processManualSingleEnvelope(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testProcessManualSingleEnvelope_whenManualEntryIsValidAndCurrentDateForContribution_thenReturnEnvelopeDetails(){
        LocalDate currentDate = LocalDate.of(2026, 5, 30);
        EnvelopeManualEntry manualEntry = EnvelopeManualEntry.builder()
                .envelopeId(1L)
                .date(currentDate)
                .amount(BigDecimal.valueOf(106.95))
                .build();

        Envelope envelope = new Envelope();
        envelope.setId(1L);

        List<Contributions> contributions = createContributions();
        EnvelopeContribution envelopeContribution = EnvelopeContribution.builder()
                        .envelope(envelope)
                        .contributions(contributions)
                        .id(1L)
                        .build();
        EnvelopeNotification envelopeNotification = EnvelopeNotification.builder()
                .id(1L)
                .envelopeId(1L)
                .envelopeName("Oculus Quest 2 Payment Plan")
                .envelopeType(EnvelopeType.PAYOFF)
                .title("Contribution Received")
                .message("Contribution of $106.95 received for Oculus Quest 2 Payment Plan")
                .envelopeStatus(EnvelopeStatus.ACTIVE)
                .isRead(false)
                .amount(BigDecimal.valueOf(106.95))
                .dateToContribute(currentDate)
                .build();

        EnvelopeDetails expected = EnvelopeDetails.builder()
                .envelope(envelope)
                .contributions(contributions)
                .errorMessage("")
                .envelopeNotification(envelopeNotification)
                .build();

        when(envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(1L, currentDate))
                .thenReturn(Optional.empty());

        when(envelopeContributionsService.createAndSaveEntry(BigDecimal.valueOf(106.95), currentDate, 1L))
                .thenReturn(envelopeContribution);
        when(envelopeNotificationService.createEnvelopeNotification(any(Envelope.class), anyList()))
                .thenReturn(Optional.of(envelopeNotification));

        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processManualSingleEnvelope(manualEntry);

        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
    }

    @Test
    void testProcessManualSingleEnvelope_whenManualEntryIsValidAndContributionDateNotTodayAndNoContributionExists_thenScheduleContributionAndReturnEnvelopeDetails(){
        LocalDate currentDate = LocalDate.of(2026, 6, 5);
        EnvelopeManualEntry manualEntry = EnvelopeManualEntry.builder()
                .envelopeId(1L)
                .date(currentDate)
                .amount(BigDecimal.valueOf(106.95))
                .build();

        Envelope envelope = new Envelope();
        envelope.setId(1L);
        envelope.setFrequency("MANUAL");

        List<Contributions> contributions = createContributions();
        EnvelopeContribution envelopeContribution = EnvelopeContribution.builder()
                .id(1L)
                .envelope(envelope)
                .contributions(contributions)
                .build();

        EnvelopeNotification envelopeNotification = EnvelopeNotification.builder()
                .id(1L)
                .envelopeId(1L)
                .envelopeName("Oculus Quest 2 Payment Plan")
                .envelopeType(EnvelopeType.PAYOFF)
                .title("Contribution Scheduled")
                .message("Contribution of $106.95 scheduled for Oculus Quest 2 Payment Plan on 2026-06-05")
                .envelopeStatus(EnvelopeStatus.ACTIVE)
                .isRead(false)
                .amount(BigDecimal.valueOf(106.95))
                .dateToContribute(currentDate)
                .build();

        EnvelopeDetails expected = EnvelopeDetails.builder()
                .envelope(envelope)
                .contributions(contributions)
                .envelopeNotification(envelopeNotification)
                .errorMessage("")
                .build();

        when(envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(1L, currentDate))
                .thenReturn(Optional.empty());
        when(envelopeContributionsService.createAndSaveEntry(BigDecimal.valueOf(106.95), currentDate, 1L))
                .thenReturn(envelopeContribution);
        when(envelopeNotificationService.createEnvelopeNotification(any(Envelope.class), anyList()))
                .thenReturn(Optional.of(envelopeNotification));

        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processManualSingleEnvelope(manualEntry);

        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
        verify(envelopeContributionScheduler).scheduleEnvelopeContribution(eq(1L), eq(currentDate), eq(any()), anyString());
    }

    @Test
    void testProcessManualSingleEnvelope_whenManualEntryIsValidAndContributionDateExistsForTodayAndEntryAmountIsLessThanMinAmount_thenReturnEnvelopeDetailsWithException(){
        LocalDate currentDate = LocalDate.of(2026, 5, 30);
        EnvelopeManualEntry manualEntry = EnvelopeManualEntry.builder()
                .envelopeId(1L)
                .date(currentDate)
                .amount(BigDecimal.valueOf(50.00))
                .build();
        Envelope envelope = new Envelope();
        envelope.setId(1L);
        envelope.setFrequency("MANUAL");

        List<Contributions> contributions = List.of(
                Contributions.builder()
                        .id(1L)
                        .scheduledDate(currentDate)
                        .contributionDate(currentDate)
                        .minAmount(106.95)
                        .maxAmount(200.00)
                        .amount(106.95)
                        .merchant("Affirm")
                        .status("PENDING")
                        .frequency("MONTHLY")
                        .build()
        );
        EnvelopeContribution envelopeContribution = EnvelopeContribution.builder()
                .id(1L)
                .envelope(envelope)
                .contributions(contributions)
                .build();

        EnvelopeDetails expected = EnvelopeDetails.builder()
                .envelope(envelope)
                .contributions(contributions)
                .envelopeNotification(null)
                .errorMessage("Entry amount of $50.00 is less than the minimum contribution amount of $106.95 required for this envelope")
                .build();
        when(envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(1L, currentDate))
                .thenReturn(Optional.of(envelopeContribution));

        System.out.println("expected: " + expected.getErrorMessage());
        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processManualSingleEnvelope(manualEntry);
        System.out.println("actual: " + actual.get().getErrorMessage());
        assertEquals(expected, actual.get());
    }

    @Test
    void testProcessManualSingleEnvelope_whenManualEntryIsValidAndContributionDateExistsForTodayAndEntryAmountIsGreaterThanMaxAmount_thenReturnEnvelopeDetailsWithException(){
        LocalDate currentDate = LocalDate.of(2026, 5, 30);
        EnvelopeManualEntry manualEntry = EnvelopeManualEntry.builder()
                .envelopeId(1L)
                .date(currentDate)
                .amount(BigDecimal.valueOf(220.01))
                .build();
        Envelope envelope = new Envelope();
        envelope.setId(1L);
        envelope.setFrequency("MANUAL");
        List<Contributions> contributions = List.of(
                Contributions.builder()
                        .id(1L)
                        .scheduledDate(currentDate)
                        .contributionDate(currentDate)
                        .minAmount(106.95)
                        .maxAmount(200.00)
                        .amount(106.95)
                        .merchant("Affirm")
                        .status("PENDING")
                        .frequency("MONTHLY")
                        .build()
        );

        EnvelopeContribution envelopeContribution = EnvelopeContribution.builder()
                .id(1L)
                .envelope(envelope)
                .contributions(contributions)
                .build();

        EnvelopeDetails expected = EnvelopeDetails.builder()
                .envelope(envelope)
                .contributions(contributions)
                .envelopeNotification(null)
                .errorMessage("Entry amount of $220.01 is greater than the maximum contribution amount of $200.00 required for this envelope")
                .build();

        when(envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(1L, currentDate))
                .thenReturn(Optional.of(envelopeContribution));

        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processManualSingleEnvelope(manualEntry);

        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
    }

    @Test
    void testProcessManualSingleEnvelope_whenManualEntryIsValidAndContributionDateExistsForTodayAndEntryAmountIsEqualToMinAmount_thenReturnEnvelopeDetailsWithException(){
        LocalDate currentDate = LocalDate.of(2026, 5, 30);
        EnvelopeManualEntry manualEntry = EnvelopeManualEntry.builder()
                .envelopeId(1L)
                .date(currentDate)
                .amount(BigDecimal.valueOf(106.95))
                .build();
        Envelope envelope = new Envelope();
        envelope.setId(1L);
        envelope.setFrequency("MANUAL");

        List<Contributions> contributions = List.of(
                Contributions.builder()
                        .id(1L)
                        .scheduledDate(currentDate)
                        .contributionDate(currentDate)
                        .minAmount(106.95)
                        .maxAmount(200.00)
                        .amount(106.95)
                        .merchant("Affirm")
                        .status("PENDING")
                        .frequency("MONTHLY")
                        .build()
        );

        EnvelopeContribution envelopeContribution = EnvelopeContribution.builder()
                .id(1L)
                .envelope(envelope)
                .contributions(contributions)
                .build();

        EnvelopeDetails expected = EnvelopeDetails.builder()
                .envelope(envelope)
                .contributions(contributions)
                .envelopeNotification(null)
                .errorMessage("A contribution of $106.95 is already scheduled for today. The system will process this contribution automatically.")
                .build();

        when(envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(1L, currentDate))
                .thenReturn(Optional.of(envelopeContribution));

        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processManualSingleEnvelope(manualEntry);

        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
    }

    @Test
    void testProcessAutoSingleEnvelope_whenEnvelopeIsNull_thenReturnEmptyOptional(){
        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processAutoSingleEnvelope(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testProcessAutoSingleEnvelope_whenEnvelopeHasNoContributions_thenReturnEnvelopeDetailsWithException(){
        Envelope envelope = Envelope.builder()
                .id(1L)
                .frequency("MANUAL")
                .build();

        when(envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(eq(1L), any(LocalDate.class)))
                .thenReturn(Optional.empty());

        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processAutoSingleEnvelope(envelope);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testProcessAutoSingleEnvelope_whenEnvelopeHasContributionsForToday_thenNotifySchedulerAndReturnEnvelopeDetails(){
        LocalDate today = LocalDate.now();
        Envelope envelope = Envelope.builder()
                .id(1L)
                .frequency("MONTHLY")
                .targetAmount(BigDecimal.valueOf(500.00))
                .currentSaved(BigDecimal.valueOf(100.00))
                .build();

        List<Contributions> contributions = new ArrayList<>();
        Contributions contribution = Contributions.builder()
                .id(1L)
                .scheduledDate(LocalDate.of(2026, 5, 31))
                .contributionDate(LocalDate.of(2026, 5, 30))
                .frequency("MONTHLY")
                .status("PENDING")
                .merchant("Affirm")
                .amount(106.95)
                .build();
        contributions.add(contribution);

        EnvelopeContribution envelopeContribution = EnvelopeContribution.builder()
                .id(1L)
                .envelope(envelope)
                .contributions(contributions)
                .build();

        EnvelopeNotification envelopeNotification = EnvelopeNotification.builder()
                .id(1L)
                .envelopeId(1L)
                .envelopeName("Oculus Quest 2 Payment Plan")
                .envelopeType(EnvelopeType.PAYOFF)
                .title("Contribution Received")
                .message("Contribution of $106.95 received for Oculus Quest 2 Payment Plan")
                .envelopeStatus(EnvelopeStatus.ACTIVE)
                .isRead(false)
                .amount(BigDecimal.valueOf(106.95))
                .dateToContribute(today)
                .build();

        EnvelopeDetails expected = EnvelopeDetails.builder()
                .envelope(envelope)
                .contributions(contributions)
                .envelopeNotification(envelopeNotification)
                .errorMessage("")
                .build();

        when(envelopeContributionsService.getEnvelopeContributionsByEnvelopeIdAndScheduledDate(eq(1L), any(LocalDate.class)))
                .thenReturn(Optional.of(envelopeContribution));
        when(envelopeContributionScheduler.isScheduled(1L))
                .thenReturn(true);
        when(envelopeNotificationService.createEnvelopeNotification(any(Envelope.class), anyList()))
                .thenReturn(Optional.of(envelopeNotification));

        Optional<EnvelopeDetails> actual = envelopeContributionEngine.processAutoSingleEnvelope(envelope);

        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
        verify(envelopeContributionScheduler, never()).scheduleEnvelopeContribution(anyLong(), any(LocalDate.class), any(), anyString());
        verify(envelopeContributionHistoryService).createAndSaveContribution(eq(envelopeContribution), any(LocalDate.class));
    }

    @Test
    void testProcessAutoLinkedEnvelope_whenEnvelopeLinkIsNull_thenReturnEmptyOptional(){
        Optional<LinkEnvelopeDetails> actual = envelopeContributionEngine.processAutoLinkedEnvelope(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testProcessAutoLinkedEnvelope_whenEnvelopeLinkHasNoEnvelopeContributions_thenThrowExceptionAndReturnEmptyOptional(){
        EnvelopeLink envelopeLink = EnvelopeLink.builder()
                .id(1L)
                .envelopes(List.of())
                .sharedBudget(BigDecimal.valueOf(500.00))
                .linkStatus("ACTIVE")
                .totalContributionAmount(BigDecimal.valueOf(500.00))
                .actualContributionAmount(BigDecimal.valueOf(0.00))
                .build();
        Optional<LinkEnvelopeDetails> actual = envelopeContributionEngine.processAutoLinkedEnvelope(envelopeLink);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testProcessAutoLinkedEnvelope_whenEnvelopeLinkHasContributionsForToday_thenReturnLinkEnvelopeDetails(){
        LocalDate today = LocalDate.now();
        Envelope envelope1 = Envelope.builder()
                .id(1L)
                .frequency("MONTHLY")
                .targetAmount(BigDecimal.valueOf(500.00))
                .currentSaved(BigDecimal.valueOf(100.00))
                .build();

        Envelope envelope2 = Envelope.builder()
                .id(2L)
                .frequency("MONTHLY")
                .targetAmount(BigDecimal.valueOf(300.00))
                .currentSaved(BigDecimal.valueOf(50.00))
                .build();

        List<Contributions> contributions1 = List.of(
                Contributions.builder()
                        .id(1L)
                        .scheduledDate(today)
                        .contributionDate(today)
                        .minAmount(50.00)
                        .maxAmount(200.00)
                        .amount(106.95)
                        .merchant("Affirm")
                        .status("PENDING")
                        .frequency("MANUAL")
                        .build()
        );

        List<Contributions> contributions2 = List.of(
                Contributions.builder()
                        .id(2L)
                        .scheduledDate(today)
                        .contributionDate(today)
                        .minAmount(50.00)
                        .maxAmount(200.00)
                        .amount(60.00)
                        .merchant("PayPal")
                        .status("PENDING")
                        .frequency("MANUAL")
                        .build()
        );

        EnvelopeContribution envelopeContribution1 = EnvelopeContribution.builder()
                .id(1L)
                .envelope(envelope1)
                .contributions(contributions1)
                .build();

        EnvelopeContribution envelopeContribution2 = EnvelopeContribution.builder()
                .id(2L)
                .envelope(envelope2)
                .contributions(contributions2)
                .build();

        EnvelopeLink envelopeLink = EnvelopeLink.builder()
                .id(1L)
                .envelopes(List.of(envelopeContribution1, envelopeContribution2))
                .sharedBudget(BigDecimal.valueOf(500.00))
                .linkStatus("ACTIVE")
                .totalContributionAmount(BigDecimal.valueOf(500.00))
                .actualContributionAmount(BigDecimal.valueOf(166.95))
                .build();

        EnvelopeNotification notification1 = EnvelopeNotification.builder()
                .id(1L)
                .envelopeId(1L)
                .envelopeName("Oculus Quest 2 Payment Plan")
                .envelopeType(EnvelopeType.PAYOFF)
                .title("Contribution Received")
                .message("Contribution of $106.95 received")
                .envelopeStatus(EnvelopeStatus.ACTIVE)
                .isRead(false)
                .amount(BigDecimal.valueOf(106.95))
                .dateToContribute(today)
                .build();

        EnvelopeNotification notification2 = EnvelopeNotification.builder()
                .id(2L)
                .envelopeId(2L)
                .envelopeName("PayPal Payment Plan")
                .envelopeType(EnvelopeType.PAYOFF)
                .title("Contribution Received")
                .message("Contribution of $60.00 received")
                .envelopeStatus(EnvelopeStatus.ACTIVE)
                .isRead(false)
                .amount(BigDecimal.valueOf(60.00))
                .dateToContribute(today)
                .build();

        List<Contributions> allContributions = new ArrayList<>();
        allContributions.addAll(contributions1);
        allContributions.addAll(contributions2);

        LinkEnvelopeDetails expected = LinkEnvelopeDetails.builder()
                .envelopeLink(envelopeLink)
                .contributions(allContributions)
                .envelopeLinkNotification(List.of(notification1, notification2))
                .errorMessage("")
                .build();

        when(envelopeContributionScheduler.isScheduled(1L)).thenReturn(true);
        when(envelopeContributionScheduler.isScheduled(2L)).thenReturn(true);
        when(envelopeNotificationService.createEnvelopeNotification(eq(envelope1), eq(contributions1)))
                .thenReturn(Optional.of(notification1));
        when(envelopeNotificationService.createEnvelopeNotification(eq(envelope2), eq(contributions2)))
                .thenReturn(Optional.of(notification2));

        Optional<LinkEnvelopeDetails> actual = envelopeContributionEngine.processAutoLinkedEnvelope(envelopeLink);

        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
        verify(envelopeContributionHistoryService).createAndSaveContribution(eq(envelopeContribution1), any(LocalDate.class));
        verify(envelopeContributionHistoryService).createAndSaveContribution(eq(envelopeContribution2), any(LocalDate.class));
    }


    private List<Contributions> createContributions() {
        Contributions contribution = Contributions.builder()
                .id(1L)
                .scheduledDate(LocalDate.of(2026, 5, 31))
                .contributionDate(LocalDate.of(2026, 5, 30))
                .frequency("MANUAL")
                .status("PENDING")
                .merchant("Affirm")
                .amount(106.95)
                .build();
        Contributions contributions2 = Contributions.builder()
                .contributionDate(LocalDate.of(2026, 4, 20))
                .scheduledDate(LocalDate.of(2026, 4, 21))
                .frequency("MANUAL")
                .amount(60.56)
                .merchant("Affirm")
                .status("PENDING")
                .build();
        Contributions contributions3 = Contributions.builder()
                .contributionDate(LocalDate.of(2026, 3, 15))
                .merchant("PayPal")
                .scheduledDate(LocalDate.of(2026, 3, 15))
                .amount(30.55)
                .frequency("MANUAL")
                .status("PENDING")
                .build();

        List<Contributions> contributions = new ArrayList<>();
        contributions.add(contributions3);
        contributions.add(contributions2);
        contributions.add(contribution);
        return contributions;
    }



    @AfterEach
    void tearDown() {
    }
}