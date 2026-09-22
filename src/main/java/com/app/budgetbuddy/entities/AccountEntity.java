package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.AccountSubType;
import com.app.budgetbuddy.domain.AccountType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Table(name="accounts")
@Entity
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class AccountEntity {

    @Id
    @Column(name="accountId")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userid")
    @JsonIgnore
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="plaid_link_id")
    private PlaidLinkEntity plaidLink;

    @Column(name = "accountName")
    private String accountName;

    @Column(name="officialName")
    private String officialName;

    @Column(name="type")
    private AccountType type;

    @Column(name="subType")
    private AccountSubType subtype;

    @Column(name="mask")
    private String mask;

    @Column(name="balance")
    private BigDecimal balance;

}
