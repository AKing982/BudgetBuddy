package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Generated;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name="accountBalanceHistories")
@Getter
@Setter
public class AccountBalanceHistoryEntity
{
    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="accountId")
    private AccountEntity account;

    @Column(name="description")
    private String description;

    @Column(name="transaction_category")
    private String transactionCategory;

    @Column(name="date")
    private LocalDate date;

    @Column(name="balance")
    private Double balance;

    @Column(name="available_balance")
    private Double availableBalance;

    @Column(name="created_at")
    private LocalDateTime createdAt;


}
