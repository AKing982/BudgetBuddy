package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.EnvelopePaymentSchedulesService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class EnvelopePaymentScheduleBuilder
{
    private final EnvelopePaymentSchedulesService envelopePaymentSchedulesService;
    private final String[] MERCHANTS = {"Affirm", "PayPal", "Klarna"};

    @Autowired
    public EnvelopePaymentScheduleBuilder(EnvelopePaymentSchedulesService envelopePaymentSchedulesService)
    {
        this.envelopePaymentSchedulesService = envelopePaymentSchedulesService;
    }

    public List<PaymentSchedule> generatePaymentSchedulesByRecurring(final RecurringTransaction recurringTransaction, final PaymentInfo paymentInfo)
    {
        if(recurringTransaction == null || paymentInfo == null)
        {
            return Collections.emptyList();
        }
        List<PaymentSchedule> paymentSchedules = new ArrayList<>();
        String transactionFrequency = recurringTransaction.getFrequency();
        int totalMonths = paymentInfo.getTotalMonths();
        double totalAmount = paymentInfo.getTotalAmount();
        double monthlyAmount = totalAmount / Math.max(1, totalMonths);
        LocalDate firstPaymentDate = paymentInfo.getFirstPaymentDate();
        boolean isPayInFour = paymentInfo.isPayInFour();
        BigDecimal firstPaymentAmount = paymentInfo.getFirstPaymentAmount();
        LocalDate endDate = paymentInfo.getEndDate();
        switch(transactionFrequency){
            case "MONTHLY":
                int counter = 0;
                while(counter < totalMonths && firstPaymentDate.isBefore(endDate))
                {
                    String status = getPaymentStatus(firstPaymentAmount, counter);
                    PaymentSchedule paymentSchedule = PaymentSchedule.builder()
                            .month(YearMonth.from(firstPaymentDate))
                            .amount(BigDecimal.valueOf(monthlyAmount))
                            .interest(BigDecimal.ZERO)
                            .balance(BigDecimal.valueOf(totalAmount))
                            .status(status)
                            .paymentPlanId(null)
                            .dueDate(firstPaymentDate)
                            .build();
                    paymentSchedules.add(paymentSchedule);
                    firstPaymentDate = firstPaymentDate.plusMonths(1);
                    counter++;
                }
                break;
                case "BIWEEKLY":
                    if(isPayInFour)
                    {
                        int counter2 = 0;
                        int totalPayments = paymentInfo.getNumberOfPayments();
                        while(counter2 < totalPayments)
                        {
                            String status = getPaymentStatus(firstPaymentAmount, counter2);
                            PaymentSchedule paymentSchedule = PaymentSchedule.builder()
                                    .month(YearMonth.from(firstPaymentDate))
                                    .amount(BigDecimal.valueOf(monthlyAmount))
                                    .interest(BigDecimal.ZERO)
                                    .balance(BigDecimal.valueOf(totalAmount))
                                    .status(status)
                                    .paymentPlanId(null)
                                    .dueDate(firstPaymentDate)
                                    .build();
                            paymentSchedules.add(paymentSchedule);
                            firstPaymentDate = firstPaymentDate.plusWeeks(2);
                            counter2++;
                        }
                    }
                    break;
            default: throw new IllegalArgumentException("Invalid frequency: " + transactionFrequency);

        }
        return paymentSchedules;
    }

    private String getPaymentStatus(BigDecimal firstPaymentAmount, int counter)
    {
        return counter == 0 & firstPaymentAmount != null ? "PAID" : "PENDING";
    }


    public List<PaymentSchedule> generatePaymentSchedulesByTransaction(final List<Transaction> transaction, final PaymentInfo paymentInfo)
    {
        if(transaction == null || paymentInfo == null)
        {
            return Collections.emptyList();
        }
        List<PaymentSchedule> paymentSchedules = new ArrayList<>();
        LocalDate firstPaymentDate = paymentInfo.getFirstPaymentDate();
        int totalPayments = paymentInfo.getNumberOfPayments();
        int totalMonths = paymentInfo.getTotalMonths();
        boolean isPayInFour = paymentInfo.isPayInFour();
        BigDecimal totalAmount = BigDecimal.valueOf(paymentInfo.getTotalAmount());
        BigDecimal paymentAmount = paymentInfo.getFirstPaymentAmount() != null
                ? paymentInfo.getFirstPaymentAmount()
                : totalAmount.divide(BigDecimal.valueOf(Math.max(1, totalMonths)), 2, RoundingMode.HALF_UP);
        BigDecimal remainingBalance = totalAmount;
        int iterations = isPayInFour ? totalPayments : totalMonths;
        for(int i = 0; i < iterations; i++)
        {
            PaymentSchedule schedule = PaymentSchedule.builder()
                    .paymentPlanId(null)
                    .month(YearMonth.from(firstPaymentDate))
                    .dueDate(firstPaymentDate)
                    .amount(paymentAmount)
                    .interest(BigDecimal.ZERO)
                    .balance(remainingBalance)
                    .status("PENDING")
                    .build();
            paymentSchedules.add(schedule);
            remainingBalance = remainingBalance.subtract(paymentAmount).max(BigDecimal.ZERO);
            firstPaymentDate = isPayInFour ? firstPaymentDate.plusWeeks(2) : firstPaymentDate.plusMonths(1);
        }
        return paymentSchedules;
    }

    private LocalDate getNextDueDate(LocalDate date, String frequency)
    {
        if(frequency == null || frequency.isEmpty())
        {
            return date.plusMonths(1);
        }
        return switch(frequency.toUpperCase())
        {
            case "WEEKLY" -> date.plusWeeks(1);
            case "BIWEEKLY" -> date.plusWeeks(2);
            case "MONTHLY" -> date.plusMonths(1);
            default -> date.plusMonths(1);
        };
    }
}
