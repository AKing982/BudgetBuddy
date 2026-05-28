package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.AccountBalanceHistoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.repositories.RecurringTransactionsRepository;
import com.app.budgetbuddy.repositories.TransactionRepository;
import com.app.budgetbuddy.services.AccountBalanceHistoryService;
import com.app.budgetbuddy.services.EnvelopeNotificationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EnvelopeNotificationBuilderTest {

    @Mock
    private EnvelopeNotificationService envelopeNotificationService;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private RecurringTransactionsRepository recurringTransactionsRepository;

    @Mock
    private AccountBalanceHistoryService accountBalanceHistoryService;

    @InjectMocks
    private EnvelopeNotificationBuilder envelopeNotificationBuilder;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCreateEnvelopeNotifications_whenEnvelopeIsNull_thenReturnEmptyOptional() {
        List<Contributions> contributions = new ArrayList<>();
        contributions.add(mock(Contributions.class));
        Optional<EnvelopeNotification> actual = envelopeNotificationBuilder.createEnvelopeNotification(null, contributions);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateEnvelopeNotifications_whenContributionsNull_thenReturnEmptyOptional(){
        Envelope envelope = mock(Envelope.class);
        Optional<EnvelopeNotification> actual = envelopeNotificationBuilder.createEnvelopeNotification(envelope, null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateEnvelopeNotifications_whenContributionsListIsEmpty_thenReturnEmptyOptional(){
        Envelope envelope = mock(Envelope.class);
        List<Contributions> contributions = new ArrayList<>();
        Optional<EnvelopeNotification> actual = envelopeNotificationBuilder.createEnvelopeNotification(envelope, contributions);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateEnvelopeNotifications_whenPurchaseEnvelope_thenReturnEnvelopeNotification(){
        Envelope envelope = Envelope.builder()
                .id(1L)
                .userId(1L)
                .envelopeName("New Laptop")
                .envelopeType(EnvelopeType.PURCHASE)
                .targetAmount(new BigDecimal("1200.00"))
                .currentSaved(new BigDecimal("300.00"))
                .targetDate(LocalDate.now().plusMonths(3))
                .startDate(LocalDate.now())
                .status("PENDING")
                .isActive(true)
                .build();

        Contributions contribution = Contributions.builder()
                .id(1L)
                .amount(300.00)
                .contributionDate(LocalDate.now())
                .merchant("Affirm")
                .scheduledDate(LocalDate.now())
                .status("COMPLETED")
                .frequency("MONTHLY")
                .build();

        when(transactionRepository.checkTransactionsByMerchantAndPostedDateAndAmountExists("Affirm",
                1L, LocalDate.now(), BigDecimal.valueOf(300.00)))
                .thenReturn(true);

        List<Contributions> contributions = List.of(contribution);
        Optional<EnvelopeNotification> result = envelopeNotificationBuilder
                .createEnvelopeNotification(envelope, contributions);
        assertThat(result).isPresent();

        EnvelopeNotification notification = result.get();
        assertThat(notification.getEnvelopeId()).isEqualTo(1L);
        assertThat(notification.getEnvelopeName()).isEqualTo("New Laptop");
        assertThat(notification.getEnvelopeType()).isEqualTo(EnvelopeType.PURCHASE);
        assertThat(notification.getTitle()).isNotBlank();
        assertThat(notification.getMessage()).isNotBlank();
        assertThat(notification.getAmount()).isEqualByComparingTo(new BigDecimal("300.00"));
        assertThat(notification.getDateToContribute()).isEqualTo(LocalDate.now());
        assertThat(notification.getEnvelopeStatus()).isEqualTo(EnvelopeStatus.PAID);
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void testCreateEnvelopeNotification_whenPurchaseEnvelopeAndVerificationPending_thenReturnEnvelopeNotification(){
        Envelope envelope = Envelope.builder()
                .id(1L)
                .userId(1L)
                .envelopeName("New Laptop")
                .envelopeType(EnvelopeType.PURCHASE)
                .targetAmount(new BigDecimal("1200.00"))
                .currentSaved(new BigDecimal("300.00"))
                .targetDate(LocalDate.now().plusMonths(3))
                .startDate(LocalDate.now())
                .status("PENDING")
                .isActive(true)
                .build();

        Contributions contribution = Contributions.builder()
                .id(1L)
                .amount(300.00)
                .contributionDate(LocalDate.now())
                .merchant("Affirm")
                .scheduledDate(LocalDate.now())
                .status("COMPLETED")
                .frequency("MONTHLY")
                .build();
        // No matching transaction found on the contribution date
        when(transactionRepository.checkTransactionsByMerchantAndPostedDateAndAmountExists(
                "Affirm", 1L, LocalDate.now(), BigDecimal.valueOf(300.00)))
                .thenReturn(false);

        List<Contributions> contributions = List.of(contribution);
        Optional<EnvelopeNotification> result = envelopeNotificationBuilder
                .createEnvelopeNotification(envelope, contributions);

        assertThat(result).isPresent();

        EnvelopeNotification notification = result.get();
        assertThat(notification.getEnvelopeId()).isEqualTo(1L);
        assertThat(notification.getEnvelopeName()).isEqualTo("New Laptop");
        assertThat(notification.getEnvelopeType()).isEqualTo(EnvelopeType.PURCHASE);
        assertThat(notification.getTitle()).isNotBlank();
        assertThat(notification.getMessage()).isNotBlank();
        assertThat(notification.getAmount()).isEqualByComparingTo(new BigDecimal("300.00"));
        assertThat(notification.getDateToContribute()).isEqualTo(LocalDate.now());
        assertThat(notification.getEnvelopeStatus()).isEqualTo(EnvelopeStatus.PENDING);
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void testCreateEnvelopeNotification_whenPayoffEnvelope_AndContributionFound_thenReturnEnvelopeNotification()
    {
        Envelope envelope = Envelope.builder()
                .id(2L)
                .userId(1L)
                .envelopeName("Pay Off TV")
                .envelopeType(EnvelopeType.PAYOFF)
                .targetAmount(new BigDecimal("899.00"))
                .currentSaved(new BigDecimal("150.00"))
                .targetDate(LocalDate.now().plusMonths(6))
                .startDate(LocalDate.now())
                .status("ACTIVE")
                .isActive(true)
                .build();

        Contributions contribution = Contributions.builder()
                .id(1L)
                .amount(150.00)
                .contributionDate(LocalDate.now())
                .merchant("Samsung")
                .scheduledDate(LocalDate.now())
                .status("COMPLETED")
                .frequency("MONTHLY")
                .build();

        when(recurringTransactionsRepository.checkForRecurringTransactionCountOnDate(
                1L, BigDecimal.valueOf(150.00), LocalDate.now()))
                .thenReturn(true);

        List<Contributions> contributions = List.of(contribution);
        Optional<EnvelopeNotification> result = envelopeNotificationBuilder
                .createEnvelopeNotification(envelope, contributions);

        assertThat(result).isPresent();

        EnvelopeNotification notification = result.get();
        assertThat(notification.getEnvelopeId()).isEqualTo(2L);
        assertThat(notification.getEnvelopeName()).isEqualTo("Pay Off TV");
        assertThat(notification.getEnvelopeType()).isEqualTo(EnvelopeType.PAYOFF);
        assertThat(notification.getTitle()).isNotBlank();
        assertThat(notification.getMessage()).isNotBlank();
        assertThat(notification.getAmount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(notification.getDateToContribute()).isEqualTo(LocalDate.now());
        assertThat(notification.getEnvelopeStatus()).isEqualTo(EnvelopeStatus.PAID);
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void testCreateEnvelopeNotification_whenPayoffEnvelope_AndContributionNotFound_thenReturnPendingNotification()
    {
        Envelope envelope = Envelope.builder()
                .id(2L)
                .userId(1L)
                .envelopeName("Pay Off TV")
                .envelopeType(EnvelopeType.PAYOFF)
                .targetAmount(new BigDecimal("899.00"))
                .currentSaved(new BigDecimal("150.00"))
                .targetDate(LocalDate.now().plusMonths(6))
                .startDate(LocalDate.now())
                .status("ACTIVE")
                .isActive(true)
                .build();

        Contributions contribution = Contributions.builder()
                .id(1L)
                .amount(150.00)
                .contributionDate(LocalDate.now())
                .merchant("Samsung")
                .scheduledDate(LocalDate.now())
                .status("COMPLETED")
                .frequency("MONTHLY")
                .build();

        when(recurringTransactionsRepository.checkForRecurringTransactionCountOnDate(
                1L, BigDecimal.valueOf(150.00), LocalDate.now()))
                .thenReturn(false);

        List<Contributions> contributions = List.of(contribution);
        Optional<EnvelopeNotification> result = envelopeNotificationBuilder
                .createEnvelopeNotification(envelope, contributions);

        assertThat(result).isPresent();

        EnvelopeNotification notification = result.get();
        assertThat(notification.getEnvelopeId()).isEqualTo(2L);
        assertThat(notification.getEnvelopeName()).isEqualTo("Pay Off TV");
        assertThat(notification.getEnvelopeType()).isEqualTo(EnvelopeType.PAYOFF);
        assertThat(notification.getTitle()).isNotBlank();
        assertThat(notification.getMessage()).isNotBlank();
        assertThat(notification.getAmount()).isEqualByComparingTo(new BigDecimal("150.00"));
        assertThat(notification.getDateToContribute()).isEqualTo(LocalDate.now());
        assertThat(notification.getEnvelopeStatus()).isEqualTo(EnvelopeStatus.PENDING);
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void testCreateEnvelopeNotification_whenContributionMadeAfterScheduledDate_PurchaseEnvelope_thenReturnNotification()
    {
        Envelope envelope = Envelope.builder()
                .id(1L)
                .userId(1L)
                .envelopeName("New Laptop")
                .envelopeType(EnvelopeType.PURCHASE)
                .targetAmount(new BigDecimal("1200.00"))
                .currentSaved(new BigDecimal("300.00"))
                .targetDate(LocalDate.now().plusMonths(3))
                .startDate(LocalDate.now().minusMonths(1))
                .status("ACTIVE")
                .isActive(true)
                .build();

        // Contribution was made after the scheduled date
        Contributions contribution = Contributions.builder()
                .id(1L)
                .amount(300.00)
                .contributionDate(LocalDate.now())
                .merchant("Affirm")
                .scheduledDate(LocalDate.now().minusDays(5))
                .status("COMPLETED")
                .frequency("MONTHLY")
                .build();

        when(transactionRepository.checkTransactionsByMerchantAndPostedDateAndAmountExists(
                "Affirm", 1L, LocalDate.now(), BigDecimal.valueOf(300.00)))
                .thenReturn(true);

        List<Contributions> contributions = List.of(contribution);
        Optional<EnvelopeNotification> result = envelopeNotificationBuilder
                .createEnvelopeNotification(envelope, contributions);

        assertThat(result).isPresent();

        EnvelopeNotification notification = result.get();
        assertThat(notification.getEnvelopeId()).isEqualTo(1L);
        assertThat(notification.getEnvelopeName()).isEqualTo("New Laptop");
        assertThat(notification.getEnvelopeType()).isEqualTo(EnvelopeType.PURCHASE);
        assertThat(notification.getTitle()).isNotBlank();
        assertThat(notification.getMessage()).isNotBlank();
        assertThat(notification.getAmount()).isEqualByComparingTo(new BigDecimal("300.00"));
        assertThat(notification.getDateToContribute()).isEqualTo(LocalDate.now().minusDays(5));
        assertThat(notification.getEnvelopeStatus()).isEqualTo(EnvelopeStatus.LATE);
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void testCreateEnvelopeNotification_whenFundEnvelopeAndContributionFound_thenReturnEnvelopeNotification()
    {
        Envelope envelope = Envelope.builder()
                .id(3L)
                .userId(1L)
                .envelopeName("Emergency Fund")
                .envelopeType(EnvelopeType.FUND)
                .targetAmount(new BigDecimal("5000.00"))
                .currentSaved(new BigDecimal("500.00"))
                .targetDate(LocalDate.now().plusMonths(12))
                .startDate(LocalDate.now())
                .linked_account_id("acc_123")
                .status("ACTIVE")
                .isActive(true)
                .build();

        Contributions contribution = Contributions.builder()
                .id(1L)
                .amount(500.00)
                .contributionDate(LocalDate.now())
                .scheduledDate(LocalDate.now())
                .status("COMPLETED")
                .frequency("MONTHLY")
                .build();

        AccountBalanceHistoryEntity balanceHistory = new AccountBalanceHistoryEntity();
        balanceHistory.setBalance(500.00);
        balanceHistory.setAvailableBalance(500.00);
        balanceHistory.setCreatedAt(LocalDate.now().atStartOfDay());

        when(accountBalanceHistoryService.findByAccountIdAndDateRange(
                "acc_123",
                LocalDate.now(),
                LocalDate.now()))
                .thenReturn(Optional.of(balanceHistory));

        List<Contributions> contributions = List.of(contribution);
        Optional<EnvelopeNotification> result = envelopeNotificationBuilder
                .createEnvelopeNotification(envelope, contributions);

        assertThat(result).isPresent();

        EnvelopeNotification notification = result.get();
        assertThat(notification.getEnvelopeId()).isEqualTo(3L);
        assertThat(notification.getEnvelopeName()).isEqualTo("Emergency Fund");
        assertThat(notification.getEnvelopeType()).isEqualTo(EnvelopeType.FUND);
        assertThat(notification.getTitle()).isNotBlank();
        assertThat(notification.getMessage()).isNotBlank();
        assertThat(notification.getAmount()).isEqualByComparingTo(new BigDecimal("500.00"));
        assertThat(notification.getDateToContribute()).isEqualTo(LocalDate.now());
        assertThat(notification.getEnvelopeStatus()).isEqualTo(EnvelopeStatus.SUBMITTED);
        assertThat(notification.isRead()).isFalse();
    }

    @Test
    void testCreateLinkedEnvelopeNotifications_whenEnvelopeLinkIsNull_thenReturnEmptyOptional(){
        List<Contributions> contributions = new ArrayList<>();
        contributions.add(mock(Contributions.class));
        Optional<EnvelopeLinkNotification> actual = envelopeNotificationBuilder.createLinkedEnvelopeNotifications(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateLinkedEnvelopeNotifications_whenLinkedEnvelopeWithMultipleEnvelopes_thenReturnEnvelopeLinkNotification()
    {
        // Envelope 1 - Purchase
        Envelope purchaseEnvelope = Envelope.builder()
                .id(1L)
                .userId(1L)
                .envelopeName("New Laptop")
                .envelopeType(EnvelopeType.PURCHASE)
                .targetAmount(new BigDecimal("1200.00"))
                .currentSaved(new BigDecimal("300.00"))
                .targetDate(LocalDate.now().plusMonths(3))
                .startDate(LocalDate.now())
                .status("ACTIVE")
                .isActive(true)
                .build();

        Contributions purchaseContribution = Contributions.builder()
                .id(1L)
                .amount(300.00)
                .contributionDate(LocalDate.now())
                .merchant("Affirm")
                .scheduledDate(LocalDate.now())
                .status("COMPLETED")
                .frequency("MONTHLY")
                .build();

        // Envelope 2 - Payoff
        Envelope payoffEnvelope = Envelope.builder()
                .id(2L)
                .userId(1L)
                .envelopeName("Pay Off TV")
                .envelopeType(EnvelopeType.PAYOFF)
                .targetAmount(new BigDecimal("899.00"))
                .currentSaved(new BigDecimal("150.00"))
                .targetDate(LocalDate.now().plusMonths(6))
                .startDate(LocalDate.now())
                .status("ACTIVE")
                .isActive(true)
                .build();

        Contributions payoffContribution = Contributions.builder()
                .id(2L)
                .amount(150.00)
                .contributionDate(LocalDate.now())
                .merchant("Samsung")
                .scheduledDate(LocalDate.now())
                .status("COMPLETED")
                .frequency("MONTHLY")
                .build();

        // Build EnvelopeContributions
        EnvelopeContribution envelopeContribution1 = EnvelopeContribution.builder()
                .id(1L)
                .envelope(purchaseEnvelope)
                .contributions(List.of(purchaseContribution))
                .build();

        EnvelopeContribution envelopeContribution2 = EnvelopeContribution.builder()
                .id(2L)
                .envelope(payoffEnvelope)
                .contributions(List.of(payoffContribution))
                .build();

        // Build EnvelopeLink
        EnvelopeLink envelopeLink = EnvelopeLink.builder()
                .id(1L)
                .envelopes(List.of(envelopeContribution1, envelopeContribution2))
                .sharedBudget(new BigDecimal("1000.00"))
                .linkStatus("ACTIVE")
                .totalContributionAmount(new BigDecimal("450.00"))
                .actualContributionAmount(new BigDecimal("450.00"))
                .build();

        // Stub repositories
        when(transactionRepository.checkTransactionsByMerchantAndPostedDateAndAmountExists(
                "Affirm", 1L, LocalDate.now(), BigDecimal.valueOf(300.00)))
                .thenReturn(true);

        when(recurringTransactionsRepository.checkForRecurringTransactionCountOnDate(
                1L, BigDecimal.valueOf(150.00), LocalDate.now()))
                .thenReturn(true);

        // Act
        Optional<EnvelopeLinkNotification> result = envelopeNotificationBuilder
                .createLinkedEnvelopeNotifications(envelopeLink);

        // Assert
        assertThat(result).isPresent();

        EnvelopeLinkNotification linkNotification = result.get();
        assertThat(linkNotification.envelopeLink()).isEqualTo(envelopeLink);
        assertThat(linkNotification.envelopeNotifications().size()).isEqualTo(2);

        EnvelopeNotification purchaseNotification = linkNotification.envelopeNotifications().get(0);
        assertThat(purchaseNotification.getEnvelopeId()).isEqualTo(1L);
        assertThat(purchaseNotification.getEnvelopeType()).isEqualTo(EnvelopeType.PURCHASE);
        assertThat(purchaseNotification.getEnvelopeStatus()).isEqualTo(EnvelopeStatus.PAID);

        EnvelopeNotification payoffNotification = linkNotification.envelopeNotifications().get(1);
        assertThat(payoffNotification.getEnvelopeId()).isEqualTo(2L);
        assertThat(payoffNotification.getEnvelopeType()).isEqualTo(EnvelopeType.PAYOFF);
        assertThat(payoffNotification.getEnvelopeStatus()).isEqualTo(EnvelopeStatus.PAID);
    }

    @AfterEach
    void tearDown() {
    }
}