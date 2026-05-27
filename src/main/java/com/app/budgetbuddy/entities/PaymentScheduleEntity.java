package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="paymentSchedules")
@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class PaymentScheduleEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JoinColumn(name="payment_plan_id")
    @ManyToOne(fetch = FetchType.LAZY)
    private PaymentPlanEntity paymentPlan;

    @Column(name="month")
    private int month;

    @Column(name="amount")
    private double amount;

    @Column(name="interest")
    private double interest;

    @Column(name="balance")
    private double balance;

    @Column(name="status")
    private String status;

}
