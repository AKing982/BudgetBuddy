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
public class PaymentPlan
{
    private Long id;
    private Long envelopeId;
    private BigDecimal originalBalance;
    private BigDecimal currentPaid;
    private BigDecimal aprRate;
    private int totalPayments;
    private BigDecimal minimumPayment;
    private LocalDate dueDate;
    private List<PaymentSchedule> paymentSchedules;

}
