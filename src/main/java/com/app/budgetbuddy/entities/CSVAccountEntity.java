package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="CSVAccounts")
@Getter
@Setter
public class CSVAccountEntity
{

    @Id
    @GeneratedValue(strategy= GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userId")
    private UserEntity user;

    @Column(name="accountName")
    private String accountName;

    @Column(name="suffix")
    private int suffix;

    @Column(name="accountNumber")
    private String accountNumber;

    @Column(name="accountType")
    private String accountType;

    @Column(name="balance")
    private double balance;

    @Column(name="isActive")
    private boolean isActive;


}
