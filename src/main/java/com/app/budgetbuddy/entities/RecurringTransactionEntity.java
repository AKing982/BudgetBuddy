package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.RecurringTransactionType;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Table(name="recurringTransactions")
@Entity
@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class RecurringTransactionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="rId")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userid")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="accountid")
    private AccountEntity account;

    @Column(name="streamId", nullable = false, unique=true)
    private String streamId;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="categoryId")
    private CategoryEntity category;

    @Column(name="description", nullable = false)
    private String description;

    @Column(name="merchantName", nullable = false)
    private String merchantName;

    @Column(name="firstDate", nullable = false)
    private LocalDate firstDate;

    @Column(name="lastDate", nullable = false)
    private LocalDate lastDate;

    @Column(name="frequency")
    private String frequency;

    @Column(name="averageAmount", nullable = false)
    private BigDecimal averageAmount;

    @Column(name="lastAmount", nullable = false)
    private BigDecimal lastAmount;

    @Column(name="active")
    private boolean active;

    @Column(name="type")
    private String type;

    @OneToMany(mappedBy = "recurringTransaction", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Set<RecurringTransactionsLink> recurringTransactionsLinks = new HashSet<>();
}
