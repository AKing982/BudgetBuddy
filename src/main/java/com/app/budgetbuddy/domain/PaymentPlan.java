package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
@ToString
public class PaymentPlan
{
    private Long id;
    private Long envelopeId;
    private String merchant;
    private BigDecimal originalBalance;
    private BigDecimal currentPaid;
    private boolean isPayInFour;
    private BigDecimal aprRate;
    private int planDuration;
    private int totalPayments;
    private BigDecimal minimumPayment;
    private LocalDate initialPaymentDate;
    private LocalDate dueDate;
    private List<PaymentSchedule> paymentSchedules;

}
