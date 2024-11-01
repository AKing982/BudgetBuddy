package com.app.budgetbuddy.domain;


import lombok.Data;

@Data
public class TransactionLink
{
    private Category category;
    private Transaction transaction;

    public TransactionLink(Category category, Transaction transaction) {
        this.category = category;
        this.transaction = transaction;
    }
}
