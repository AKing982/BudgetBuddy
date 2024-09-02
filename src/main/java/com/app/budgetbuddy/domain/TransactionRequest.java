package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.plaid.client.model.Transaction;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionRequest
{
    List<Transaction> transactions;
}
