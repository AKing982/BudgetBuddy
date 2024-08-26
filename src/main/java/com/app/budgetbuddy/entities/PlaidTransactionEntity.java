package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Table(name="plaidTransactions")
@Entity
@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class PlaidTransactionEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="acctID")
    private String acctID;

    @Column(name="transactionID")
    private String transactionID;

    @Column(name="amount")
    private BigDecimal amount;

    @Column(name="name")
    private String name;

    @Column(name="pending")
    private boolean pending;

    @Column(name="merchantName")
    private String merchantName;

    @Column(name="authorizedDate")
    private LocalDate authorizedDate;

    @Column(name="createdAt")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;



}
