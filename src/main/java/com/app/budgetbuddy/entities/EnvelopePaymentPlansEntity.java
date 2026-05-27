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
    @JoinColumn(name="envelopeId")
    private EnvelopeEntity envelope;

    @Column(name="original_balance")
    private Double originalBalance;

    @Column(name="intial_paid")
    private Double intialPaid;

    @Column(name="minimum_payment")
    private Double minimumPayment;

    @Column(name="due_date")
    private LocalDate dueDate;
}
