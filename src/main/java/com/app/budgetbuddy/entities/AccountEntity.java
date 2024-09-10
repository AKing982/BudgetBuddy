package com.app.budgetbuddy.entities;

import com.plaid.client.model.AccountSubtype;
import com.plaid.client.model.AccountType;
import jakarta.persistence.*;
import lombok.Data;

import java.math.BigDecimal;

@Table(name="accounts")
@Entity
@Data
public class AccountEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="account_reference_number")
    private String accountReferenceNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userid")
    private UserEntity user;

    @Column(name = "accountName")
    private String accountName;

    @Column(name="officialName")
    private String officialName;

    @Column(name="type")
    private AccountType type;

    @Column(name="subType")
    private AccountSubtype subtype;

    @Column(name="mask")
    private String mask;

    @Column(name="balance")
    private BigDecimal balance;

}
