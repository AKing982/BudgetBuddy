package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

@Getter
@Setter
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class PaymentSchedule
{
    private Long paymentPlanId;
    private YearMonth month;
    private LocalDate dueDate;
    private BigDecimal amount;
    private BigDecimal interest;
    private BigDecimal balance;
    private String status;
}

