package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="envelopePaymentSchedules")
@Getter
@Setter
@AllArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@NoArgsConstructor(access = lombok.AccessLevel.PUBLIC)
@Builder
public class EnvelopePaymentSchedulesEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="payment_plan_id")
    private PaymentPlanEntity paymentPlan;

    @Column(name="month")
    private Integer month;

    @Column(name="year")
    private Integer year;

    @Column(name="payment_amount")
    private Double paymentAmount;

    @Column(name="current_balance")
    private Double currentBalance;

    @Column(name="status")
    private String status;

}
