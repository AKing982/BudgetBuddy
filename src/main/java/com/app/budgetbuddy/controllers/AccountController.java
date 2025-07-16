package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.AccountResponse;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.services.AccountService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(value="/api/accounts")
@CrossOrigin(value="http://localhost:3000")
public class AccountController
{

    private final AccountService accountService;
    private final Logger LOGGER = LoggerFactory.getLogger(AccountController.class);

    @Autowired
    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/{userId}")
    public ResponseEntity<?> getAccountsForUser(@PathVariable Long userId) {
        if(userId < 1L) {
            return ResponseEntity.badRequest().build();
        }
        try
        {
            List<AccountEntity> accounts = accountService.findByUser(userId);
            List<AccountResponse> accountResponses = createAccountResponse(accounts);
            return ResponseEntity.ok(accountResponses);
        }catch(Exception e)
        {
            LOGGER.error(e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }

    private List<AccountResponse> createAccountResponse(List<AccountEntity> accounts) {
        List<AccountResponse> accountResponses = new ArrayList<>();
        for(AccountEntity account : accounts) {
            String accountId = account.getId();
            Long userId = account.getUser().getId();
            String accountName = account.getAccountName();
            String officialName = account.getOfficialName();
            String type = account.getType().toString();
            String subtype = account.getSubtype().toString();
            String mask = account.getMask();
            BigDecimal balance = account.getBalance();

            AccountResponse accountResponse = new AccountResponse(accountId, userId, accountName, balance, type, mask, type, officialName, subtype);
            accountResponses.add(accountResponse);
        }
        return accountResponses;
    }
}
