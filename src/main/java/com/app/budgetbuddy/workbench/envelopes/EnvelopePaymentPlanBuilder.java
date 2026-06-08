package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.EnvelopePaymentPlansService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.services.TransactionService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class EnvelopePaymentPlanBuilder
{
    private final RecurringTransactionService recurringTransactionService;
    private final TransactionService transactionService;
    private final EnvelopePaymentPlansService envelopePaymentPlansService;
    private final EnvelopePaymentScheduleBuilder scheduleBuilder;

    @Autowired
    public EnvelopePaymentPlanBuilder(EnvelopePaymentPlansService envelopePaymentPlansService,
                                      RecurringTransactionService recurringTransactionService,
                                      TransactionService transactionService,
                                      EnvelopePaymentScheduleBuilder scheduleBuilder)
    {
        this.envelopePaymentPlansService = envelopePaymentPlansService;
        this.recurringTransactionService = recurringTransactionService;
        this.transactionService = transactionService;
        this.scheduleBuilder = scheduleBuilder;
    }

    public Optional<PaymentPlan> build(final NewEnvelopeCriteria newEnvelopeCriteria)
    {
        if(newEnvelopeCriteria == null)
        {
            return Optional.empty();
        }
        PaymentInfo paymentInfo = newEnvelopeCriteria.getPaymentInfo();
        BigDecimal paymentAmount = paymentInfo.getFirstPaymentAmount();
        int totalPayments = paymentInfo.getNumberOfPayments();
        LocalDate dueDate = paymentInfo.getEndDate();
        double totalPaymentBalance = paymentInfo.getTotalAmount();
        List<PaymentSchedule> paymentSchedules = getPaymentSchedules(paymentInfo);
        PaymentPlan paymentPlan = PaymentPlan.builder()
                .paymentSchedules(paymentSchedules)
                .originalBalance(BigDecimal.valueOf(totalPaymentBalance))
                .totalPayments(totalPayments)
                .planDuration(paymentInfo.getTotalMonths())
                .initialPaymentDate(paymentInfo.getFirstPaymentDate())
                .isPayInFour(paymentInfo.isPayInFour())
                .merchant(paymentInfo.getMerchant())
                .minimumPayment(paymentAmount)
                .dueDate(dueDate)
                .currentPaid(BigDecimal.ZERO)
                .aprRate(BigDecimal.ZERO)
                .envelopeId(null)
                .build();
        log.info("Payment Plan: {}", paymentPlan);
        return Optional.of(paymentPlan);
    }

    private List<PaymentSchedule> getPaymentSchedules(final PaymentInfo paymentInfo)
    {
        String merchant = paymentInfo.getMerchant();
        BigDecimal paymentAmount = paymentInfo.getFirstPaymentAmount();
        List<RecurringTransaction> recurringTransactions = recurringTransactionService.findRecurringTransactionsByMerchantAndAmount(merchant, paymentAmount);
        if(recurringTransactions.isEmpty())
        {
            List<Transaction> transactions = transactionService.getTransactionsByMerchantAndAmount(merchant, paymentAmount);
            return scheduleBuilder.generatePaymentSchedulesByTransaction(transactions, paymentInfo);
        }
        return scheduleBuilder.generatePaymentSchedulesByRecurring(recurringTransactions.get(0), paymentInfo);
    }
}
