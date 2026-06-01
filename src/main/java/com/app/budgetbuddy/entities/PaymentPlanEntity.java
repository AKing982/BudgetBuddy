package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="paymentPlans")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Deprecated
public class PaymentPlanEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="envelope_id")
    private EnvelopeEntity envelope;

    @Column(name="plan_name")
    private String planName;

    @Column(name="plan_description")
    private String planDescription;

    @Column(name="original_balance")
    private Double originalBalance;

    @Column(name="currently_paid")
    private double currentlyPaid;

    @Column(name="apr_rate")
    private double aprRate;

    @Column(name="total_payments")
    private int totalPayments;

    @Column(name="minimum_payment")
    private BigDecimal minimumPayment;

    @Column(name="due_date")
    private LocalDate dueDate;





}
