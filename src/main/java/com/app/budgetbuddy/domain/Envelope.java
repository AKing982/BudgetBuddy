package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

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
    private EnvelopeMode mode;
    private BigDecimal currentScore;
    private String linked_account_id;
    private EnvelopeStatus envelopeStatus;


}
