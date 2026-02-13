package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.Category;
import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Table(name="transactions")
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionsEntity
{

    @Id
    @Column(name="transactionId")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="acctid")
    @JsonManagedReference
    private AccountEntity account;

    @Column(name="category_id")
    private String categoryId;

    @Column(name="primary_category")
    private String primaryCategory;

    @Column(name="secondary_category")
    private String secondaryCategory;

    @Column(name = "amount")
    private BigDecimal amount;

    @Column(name="description")
    private String description;

    @Column(name="posted")
    private LocalDate posted;

    @Column(name="currencyCode")
    private String isoCurrencyCode;

    @Column(name="merchantName")
    private String merchantName;

    @Column(name="name")
    private String name;

    @Column(name="pending")
    private boolean pending;

    @Column(name="logo")
    private String logoUrl;

    @Column(name="authorizeddate")
    private LocalDate authorizedDate;

    @Column(name="createdat")
    private LocalDate createDate;

    @Column(name="issystemcategorized")
    private boolean issystemCategorized;


}
