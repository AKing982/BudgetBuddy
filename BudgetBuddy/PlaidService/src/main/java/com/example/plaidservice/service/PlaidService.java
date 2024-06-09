package com.example.plaidservice.service;

import com.example.plaidservice.dto.PlaidRequestDTO;
import com.example.plaidservice.dto.PlaidResponseDTO;
import com.example.plaidservice.model.PlaidAccount;
import com.plaid.client.model.AccountsGetRequest;
import com.plaid.client.model.AccountsGetResponse;
import com.plaid.client.request.PlaidApi;
import lombok.Value;
import org.springframework.stereotype.Service;
import retrofit2.Response;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PlaidService
{
    @Value("${plaid.clientId}")
    private String clientId;

    @Value("${plaid.secret}")
    private String secret;

    private final PlaidApi plaidApi;

    public PlaidService(PlaidApi plaidApi){
        this.plaidApi = plaidApi;
    }

    public PlaidResponseDTO getAccounts(PlaidRequestDTO plaidRequestDTO){
        try {
            AccountsGetRequest request = new AccountsGetRequest()
                    .accessToken(plaidRequestDTO.accessToken())
                    .clientId(clientId)
                    .secret(secret);
            Response<AccountsGetResponse> response = plaidApi.accountsGet(request).execute();

            if (!response.isSuccessful()) {
                throw new RuntimeException("Error fetching accounts from Plaid: " + response.message());
            }

            AccountsGetResponse accountsResponse = response.body();
            List<PlaidAccount> accounts = accountsResponse.getAccounts().stream().map(account -> {
                PlaidAccount plaidAccount = new PlaidAccount();
                plaidAccount.setAccountId(account.getAccountId());
                plaidAccount.setName(account.getName());
                plaidAccount.setOfficialName(account.getOfficialName());
                plaidAccount.setType(account.getType());
                plaidAccount.setSubType(account.getSubtype());
                plaidAccount.setBalance(account.getBalances().getAvailable());
                return plaidAccount;
            }).collect(Collectors.toList());

            PlaidResponseDTO responseDTO = new PlaidResponseDTO();
            responseDTO.setRequestId(accountsResponse.getRequestId());
            responseDTO.setAccounts(accounts);
            return responseDTO;
        } catch (Exception e) {
            throw new RuntimeException("Error fetching accounts from Plaid", e);
        }
    }
}
