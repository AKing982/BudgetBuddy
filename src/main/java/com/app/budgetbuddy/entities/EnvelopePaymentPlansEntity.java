package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name="envelopePaymentPlans")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
public class EnvelopePaymentPlansEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="envelope_id")
    private EnvelopeEntity envelope;

    @Column(name="merchant")
    private String merchant;

    @Column(name="original_balance")
    private Double originalBalance;

    @Column(name="initial_paid")
    private Double initialPaid;

    @Column(name="is_pay_in_four")
    private boolean isPayInFour;

    @Column(name="minimum_payment")
    private Double minimumPayment;

    @Column(name="plan_duration")
    private int planDuration;

    @Column(name="total_payments")
    private int totalPayments;

    @Column(name="initial_payment_date")
    private LocalDate initialPaymentDate;

    @Column(name="due_date")
    private LocalDate dueDate;
}
