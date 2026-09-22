package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="InvestmentHoldings")
@Getter
@Setter
public class InvestmentHoldingsEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="name")
    private String name;

    @Column(name="security_id")
    private String securityId;

    @OneToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="account_id")
    private AccountEntity account;

    @Column(name="amount")
    private Double amount;

    @Column(name="vested_amount")
    private Double vestedAmount;

    @Column(name="cost_basis")
    private Double costBasis;

}
