package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.PaymentPlan;
import com.app.budgetbuddy.domain.PaymentSchedule;
import com.app.budgetbuddy.exceptions.EnvelopeException;
import com.app.budgetbuddy.services.*;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class EnvelopeBuilderServiceTest
{
    @Mock
    private EnvelopeCalculations envelopeCalculations;

    @Mock
    private LinkedEnvelopesService linkedEnvelopesService;

    @Mock
    private EnvelopeContributionsService envelopeContributionsService;

    @Mock
    private EnvelopePaymentPlansService envelopePaymentPlansService;

    @Mock
    private EnvelopeContributionBuilder envelopeContributionBuilder;

    @Mock
    private EnvelopePaymentPlanBuilder envelopePaymentPlanBuilder;

    @Mock
    private EnvelopePaymentSchedulesService envelopePaymentSchedulesService;

    @Mock
    private EnvelopeService envelopeService;

    @InjectMocks
    private EnvelopeBuilderService envelopeBuilderService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCreatePaymentSchedules_whenPaymentPlanIsNull_thenThrowEnvelopeException(){
        assertThrows(EnvelopeException.class, () -> {
            envelopeBuilderService.createPaymentSchedules(null);
        });
    }

    @Test
    void testCreatePaymentSchedules_whenPaymentPlanIsPayInFour_thenReturnPaymentSchedules(){
        // Arrange
        LocalDate initialPaymentDate = LocalDate.of(2026, 6, 5);
        LocalDate dueDate            = initialPaymentDate.plusWeeks(6);

        BigDecimal originalBalance = new BigDecimal("400.00");
        BigDecimal currentPaid     = new BigDecimal("0.00");
        BigDecimal minimumPayment  = new BigDecimal("100.00");

        PaymentPlan paymentPlan = PaymentPlan.builder()
                .id(1L)
                .totalPayments(4)
                .planDuration(2)
                .initialPaymentDate(initialPaymentDate)
                .dueDate(dueDate)
                .originalBalance(originalBalance)
                .currentPaid(currentPaid)
                .minimumPayment(minimumPayment)
                .isPayInFour(true)
                .build();

        // Build the expected list manually — same logic the method uses
        List<PaymentSchedule> expectedSchedules = List.of(
                PaymentSchedule.builder()
                        .paymentPlanId(1L)
                        .dueDate(initialPaymentDate.plusWeeks(2))
                        .amount(minimumPayment)
                        .balance(new BigDecimal("300.00"))
                        .status("PENDING")
                        .build(),
                PaymentSchedule.builder()
                        .paymentPlanId(1L)
                        .dueDate(initialPaymentDate.plusWeeks(4))
                        .amount(minimumPayment)
                        .balance(new BigDecimal("200.00"))
                        .status("PENDING")
                        .build(),
                PaymentSchedule.builder()
                        .paymentPlanId(1L)
                        .dueDate(initialPaymentDate.plusWeeks(6))
                        .amount(minimumPayment)
                        .balance(new BigDecimal("100.00"))
                        .status("PENDING")
                        .build(),
                PaymentSchedule.builder()
                        .paymentPlanId(1L)
                        .dueDate(initialPaymentDate.plusWeeks(8))
                        .amount(minimumPayment)
                        .balance(new BigDecimal("0.00"))
                        .status("PENDING")
                        .build()
        );

        // Act
        List<PaymentSchedule> result = envelopeBuilderService.createPaymentSchedules(paymentPlan);

        // Assert
        assertNotNull(result);
        assertEquals(expectedSchedules.size(), result.size(), "Should produce exactly 4 schedules");

        for (int i = 0; i < expectedSchedules.size(); i++) {
            PaymentSchedule expected = expectedSchedules.get(i);
            PaymentSchedule actual   = result.get(i);

            assertEquals(expected.getPaymentPlanId(), actual.getPaymentPlanId(),
                    "Payment " + (i + 1) + ": paymentPlanId mismatch");
            assertEquals(expected.getDueDate(), actual.getDueDate(),
                    "Payment " + (i + 1) + ": dueDate mismatch");
            assertEquals(0, expected.getAmount().compareTo(actual.getAmount()),
                    "Payment " + (i + 1) + ": amount mismatch");
            assertEquals(0, expected.getBalance().compareTo(actual.getBalance()),
                    "Payment " + (i + 1) + ": balance mismatch");
            assertEquals(expected.getStatus(), actual.getStatus(),
                    "Payment " + (i + 1) + ": status mismatch");
        }
    }

    @Test
    void testCreatePaymentSchedules_whenPaymentPlanIsMonthly_thenReturnPaymentSchedules() {
        // Arrange
        LocalDate initialPaymentDate = LocalDate.of(2026, 6, 26);
        LocalDate dueDate            = LocalDate.of(2027, 6, 26);

        BigDecimal originalBalance = new BigDecimal("690.00");
        BigDecimal currentPaid     = new BigDecimal("0.00");
        BigDecimal minimumPayment  = new BigDecimal("57.50"); // 690 / 12

        PaymentPlan paymentPlan = PaymentPlan.builder()
                .id(2L)
                .totalPayments(12)
                .planDuration(12)
                .initialPaymentDate(initialPaymentDate)
                .dueDate(dueDate)
                .originalBalance(originalBalance)
                .currentPaid(currentPaid)
                .minimumPayment(minimumPayment)
                .isPayInFour(false)
                .build();

        // Build expected list — 12 monthly payments, balance decreasing by 57.50 each time
        List<PaymentSchedule> expectedSchedules = new ArrayList<>();
        BigDecimal runningBalance = originalBalance;
        for (int i = 0; i < 12; i++) {
            runningBalance = runningBalance.subtract(minimumPayment);
            expectedSchedules.add(PaymentSchedule.builder()
                    .paymentPlanId(2L)
                    .dueDate(initialPaymentDate.plusMonths(i))
                    .amount(minimumPayment)
                    .balance(runningBalance)
                    .status("PENDING")
                    .build());
        }

        // Act
        List<PaymentSchedule> result = envelopeBuilderService.createPaymentSchedules(paymentPlan);

        // Assert
        assertNotNull(result, "Result should not be null");
        assertEquals(expectedSchedules.size(), result.size(), "Should produce exactly 12 monthly schedules");

        for (int i = 0; i < expectedSchedules.size(); i++) {
            PaymentSchedule expected = expectedSchedules.get(i);
            PaymentSchedule actual   = result.get(i);

            assertEquals(expected.getPaymentPlanId(), actual.getPaymentPlanId(),
                    "Payment " + (i + 1) + ": paymentPlanId mismatch");
            assertEquals(expected.getDueDate(), actual.getDueDate(),
                    "Payment " + (i + 1) + ": dueDate mismatch — expected "
                            + expected.getDueDate() + " but got " + actual.getDueDate());
            assertEquals(0, expected.getAmount().compareTo(actual.getAmount()),
                    "Payment " + (i + 1) + ": amount mismatch");
            assertEquals(0, expected.getBalance().compareTo(actual.getBalance()),
                    "Payment " + (i + 1) + ": balance mismatch — expected "
                            + expected.getBalance() + " but got " + actual.getBalance());
            assertEquals(expected.getStatus(), actual.getStatus(),
                    "Payment " + (i + 1) + ": status mismatch");
        }

        // Verify the final balance is zero (fully paid off)
        assertEquals(0,
                BigDecimal.ZERO.compareTo(result.get(result.size() - 1).getBalance()),
                "Final payment should leave a zero balance");
    }

    @AfterEach
    void tearDown() {
    }
}