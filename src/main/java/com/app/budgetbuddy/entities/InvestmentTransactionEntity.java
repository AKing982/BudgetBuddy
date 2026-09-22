package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name="investmentTransactions")
@Getter
@Setter
public class InvestmentTransactionEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="account_id")
    private AccountEntity account;

    @Column(name="investment_transaction_id", unique=true)
    private String investmentTransactionId;

    @Column(name="name")
    private String name;

    @Column(name="price")
    private Double price;

    @Column(name="quantity")
    private Double quantity;

    @Column(name="date")
    private LocalDate date;

    @Column(name="amount")
    private Double amount;

    @Column(name="type")
    private String type;

    @Column(name="subtype")
    private String subtype;
}
