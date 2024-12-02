package com.app.budgetbuddy.domain;


import lombok.Data;

import java.util.List;

@Data
public class TransactionLink
{
    private String category;
    private String transactionId;

    public TransactionLink(String category, String transactionId) {
        this.category = category;
        this.transactionId = transactionId;
    }
}
