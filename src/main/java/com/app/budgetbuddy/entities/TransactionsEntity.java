package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Table(name="transactions")
@Entity
@Data
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionsEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="accountId")
    private AccountEntity account;

    @Column(name="transactionId")
    private String transactionId;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name="description")
    private String description;

    @Column(name="posted")
    private LocalDate posted;

    @Column(name="isoCurrencyCode")
    private String isoCurrencyCode;

    @Column(name="categoryId")
    private String categoryId;

    @Column(name="merchantName")
    private String merchantName;

    @Column(name="pending")
    private boolean pending;

    @Column(name="authorizedDate")
    private LocalDate authorizedDate;

    @Embedded
    private PersonalFinanceCategory personalFinanceCategory;

    @ElementCollection
    @CollectionTable(name="transaction_categories", joinColumns=@JoinColumn(name="transaction_id"))
    @Column(name="category")
    private List<String> categories = new ArrayList<>();

}
