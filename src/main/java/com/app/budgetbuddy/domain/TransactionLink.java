package com.app.budgetbuddy.domain;


import lombok.Data;

import java.util.List;

@Data
public class TransactionLink
{
    private String category;
    private Transaction transaction;

    public TransactionLink(String category, Transaction transaction) {
        this.category = category;
        this.transaction = transaction;
    }
}
