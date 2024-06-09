package com.example.userservice.model;

import lombok.Data;

import java.math.BigDecimal;
import java.util.Date;

@Data
public class Account
{
    private Long id;
    private User user;
    private String name;
    private BigDecimal balance;
    private Date createdDate;

    public Account(Long id, User user, String name, BigDecimal balance, Date createdDate) {
        this.id = id;
        this.user = user;
        this.name = name;
        this.balance = balance;
        this.createdDate = createdDate;
    }
}
