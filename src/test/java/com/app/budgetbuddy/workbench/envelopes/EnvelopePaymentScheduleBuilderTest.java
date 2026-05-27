package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.PaymentInfo;
import com.app.budgetbuddy.domain.PaymentSchedule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.EnvelopePaymentSchedulesService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class EnvelopePaymentScheduleBuilderTest {

    @Mock
    private EnvelopePaymentSchedulesService envelopePaymentSchedulesService;

    @InjectMocks
    private EnvelopePaymentScheduleBuilder envelopePaymentScheduleBuilder;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testGeneratePaymentSchedulesByTransactions_whenTransactionsAndPaymentInfoNotNull_thenReturnPaymentSchedules(){
        Transaction transaction = Transaction.builder()
                .transactionId("e2323434342")
                .amount(BigDecimal.valueOf(106.95))
                .posted(LocalDate.of(2026, 6, 5))
                .merchantName("Affirm")
                .build();

        Transaction transaction2 = Transaction.builder()
                .transactionId("dcddfdfdfdfd")
                .amount(BigDecimal.valueOf(106.95))
                .posted(LocalDate.of(2026, 5, 5))
                .merchantName("Affirm")
                .build();

        List<Transaction> transactions = List.of(transaction, transaction2);

        PaymentInfo paymentInfo = PaymentInfo.builder()
                .firstPaymentAmount(BigDecimal.valueOf(106.95))
                .numberOfPayments(12)
                .totalMonths(12)
                .firstPaymentDate(LocalDate.of(2026, 6, 5))
                .description("Ryzen 7 Motherboard/Processor bundle")
                .merchant("Affirm")
                .build();

        List<PaymentSchedule> expected = generatePaymentSchedules(transactions, paymentInfo);
        List<PaymentSchedule> actual = envelopePaymentScheduleBuilder.generatePaymentSchedulesByTransaction(transactions, paymentInfo);
        assertNotNull(actual);
        for(int i = 0; i < expected.size(); i++)
        {
            PaymentSchedule expectedSchedule = expected.get(i);
            PaymentSchedule actualSchedule = actual.get(i);
            assertEquals(expectedSchedule.getAmount(), actualSchedule.getAmount());
            assertEquals(expectedSchedule.getBalance(), actualSchedule.getBalance());
            assertEquals(expectedSchedule.getDueDate(), actualSchedule.getDueDate());
            assertEquals(expectedSchedule.getInterest(), actualSchedule.getInterest());
            assertEquals(expectedSchedule.getMonth(), actualSchedule.getMonth());
            assertEquals(expectedSchedule.getStatus(), actualSchedule.getStatus());
        }
    }

    @Test
    void testGeneratePaymentSchedulesByTransaction_whenPayInFourMethod_thenReturnPaymentSchedules()
    {
        Transaction transaction = Transaction.builder()
                .transactionId("p4567891011")
                .amount(BigDecimal.valueOf(200.00))
                .posted(LocalDate.of(2026, 6, 5))
                .merchantName("Klarna")
                .build();

        List<Transaction> transactions = List.of(transaction);

        PaymentInfo paymentInfo = PaymentInfo.builder()
                .firstPaymentAmount(BigDecimal.valueOf(50.00))
                .numberOfPayments(4)
                .firstPaymentDate(LocalDate.of(2026, 6, 5))
                .isPayInFour(true)
                .description("Pay in 4 purchase")
                .merchant("Klarna")
                .build();

        List<PaymentSchedule> expected = new ArrayList<>();
        LocalDate dueDate = LocalDate.of(2026, 6, 5);
        BigDecimal paymentAmount = BigDecimal.valueOf(50.00);
        BigDecimal remainingBalance = BigDecimal.valueOf(0.0);

        for (int i = 0; i < 4; i++) {
            expected.add(PaymentSchedule.builder()
                    .paymentPlanId(null)
                    .month(YearMonth.from(dueDate))
                    .dueDate(dueDate)
                    .amount(paymentAmount)
                    .interest(BigDecimal.ZERO)
                    .balance(remainingBalance)
                    .status("PENDING")
                    .build());
            dueDate = dueDate.plusWeeks(2);
        }
        List<PaymentSchedule> actual = envelopePaymentScheduleBuilder.generatePaymentSchedulesByTransaction(transactions, paymentInfo);
        assertNotNull(actual);
        assertEquals(4, actual.size());

        LocalDate expectedDueDate = LocalDate.of(2026, 6, 5);
        BigDecimal expectedAmount = BigDecimal.valueOf(50.00);

        for (int i = 0; i < expected.size(); i++) {
            PaymentSchedule schedule = actual.get(i);
            assertEquals(expectedAmount, schedule.getAmount());
            assertEquals(expectedDueDate, schedule.getDueDate());
            assertEquals(YearMonth.from(expectedDueDate), schedule.getMonth());
            assertEquals(BigDecimal.ZERO, schedule.getInterest());
            assertEquals("PENDING", schedule.getStatus());
            expectedDueDate = expectedDueDate.plusWeeks(2);
        }
    }

    public List<PaymentSchedule> generatePaymentSchedules(final List<Transaction> transactions, final PaymentInfo paymentInfo)
    {
        if (paymentInfo == null)
        {
            return Collections.emptyList();
        }
        List<PaymentSchedule> paymentSchedules = new ArrayList<>();
        LocalDate currentDate = paymentInfo.getFirstPaymentDate() != null
                ? paymentInfo.getFirstPaymentDate()
                : LocalDate.now();

        BigDecimal totalAmount = BigDecimal.valueOf(paymentInfo.getTotalAmount());
        int totalMonths = paymentInfo.getTotalMonths() != 0
                ? paymentInfo.getTotalMonths()
                : paymentInfo.getNumberOfPayments();
        BigDecimal paymentAmount = paymentInfo.getFirstPaymentAmount() != null
                ? paymentInfo.getFirstPaymentAmount()
                : totalAmount.divide(BigDecimal.valueOf(Math.max(1, totalMonths)), 2, RoundingMode.HALF_UP);
        BigDecimal remainingBalance = totalAmount;

        for (int i = 0; i < totalMonths; i++) {
            PaymentSchedule schedule = PaymentSchedule.builder()
                    .paymentPlanId(null)
                    .month(YearMonth.from(currentDate))
                    .dueDate(currentDate)
                    .amount(paymentAmount)
                    .interest(BigDecimal.ZERO)
                    .balance(remainingBalance)
                    .status("PENDING")
                    .build();

            paymentSchedules.add(schedule);
            remainingBalance = remainingBalance.subtract(paymentAmount).max(BigDecimal.ZERO);
            currentDate = currentDate.plusMonths(1);
        }

        return paymentSchedules;
    }

    private String determineStatus(LocalDate dueDate, List<Transaction> transactions) {
        return transactions.stream()
                .anyMatch(tx -> tx.getPosted() != null && tx.getPosted().equals(dueDate))
                ? "PAID"
                : "UPCOMING";
    }

    @AfterEach
    void tearDown() {
    }
}