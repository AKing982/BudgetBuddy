package com.example.plaidservice.dto;

import com.example.plaidservice.model.PlaidAccount;
import com.example.plaidservice.model.PlaidTransaction;

import java.util.List;


public record PlaidResponseDTO(String requestId, List<PlaidAccount> accounts,
                               List<PlaidTransaction> transactionList) {
}
