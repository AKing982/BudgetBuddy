package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.Category;
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
    @JoinColumn(name="acctid")
    private AccountEntity account;

    @Column(name="transaction_reference_number", unique=true)
    private String transactionReferenceNumber;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name="description")
    private String description;

    @Column(name="posted")
    private LocalDate posted;

    @Column(name="currencyCode")
    private String isoCurrencyCode;

    @Column(name="categoryid")
    private String categoryId;

    @Column(name="merchantName")
    private String merchantName;

    @Column(name="pending")
    private boolean pending;

    @Column(name="authorizeddate")
    private LocalDate authorizedDate;

    @Column(name="createdat")
    private LocalDate createDate;

//    @ElementCollection
//    @CollectionTable(name="transaction_categories", joinColumns=@JoinColumn(name="id"))
//    @Column(name="category")
//    private List<String> categories = new ArrayList<>();

}
