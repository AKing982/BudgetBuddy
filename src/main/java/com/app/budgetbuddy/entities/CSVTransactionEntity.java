package com.app.budgetbuddy.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="CSVTransactions")
@Getter
@Setter
public class CSVTransactionEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="csvAcctId")
    @JsonIgnore
    private CSVAccountEntity csvAccount;

    @Column(name="transactionDate")
    private LocalDate transactionDate;

    @Column(name="transactionAmount")
    private BigDecimal transactionAmount;

    @Column(name="description")
    private String description;

    @Column(name="extendedDescription")
    private String extendedDescription;

    @Column(name="electronicTransactionDate")
    private LocalDate electronicTransactionDate;

    @Column(name="merchantName")
    private String merchantName;

    @Column(name="institution_id")
    private String institutionId;

    @Column(name="balance")
    private BigDecimal balance;

    @Column(name="isSystemCategorized")
    private boolean isSystemCategorized;
}
