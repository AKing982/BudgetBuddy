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

    @Column(name="accountId")
    private String accountId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userId")
    private UserEntity user;

    @Column(name = "account_name")
    private String accountName;

    @Column(name="official_name")
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
