package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class Envelope
{
    private Long id;
    private Long userId;
    private String envelopeName;
    private String goal;
    private EnvelopeType envelopeType;
    private int duration;
    private LocalDate targetDate;
    private LocalDate startDate;
    private BigDecimal budgeted;
    private BigDecimal currentSaved;
    private BigDecimal targetAmount;
    private PaymentPlan paymentPlan;
    private String frequency;
    private boolean isActive;
    private boolean isEmailEnabled;
    private String status;
    private BigDecimal currentScore;


}
