package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.AccountNotFoundException;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;

@Component
public class TransactionToEntityConverter implements Converter<Transaction, TransactionsEntity>
{
    private final AccountRepository accountRepository;
    private final CategoryService categoryService;

    @Autowired
    public TransactionToEntityConverter(AccountRepository accountRepository, CategoryService categoryRepository){
        this.accountRepository = accountRepository;
        this.categoryService = categoryRepository;
    }

    @Override
    public TransactionsEntity convert(Transaction transaction)
    {
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setAccount(fetchAccountByAccountId(transaction.getAccountId()));
        transactionsEntity.setPending(transaction.getPending());
        transactionsEntity.setAmount(transaction.getAmount());
        transactionsEntity.setDescription(transaction.getDescription());
        transactionsEntity.setPosted(transaction.getPosted());
        transactionsEntity.setId(transaction.getTransactionId());
        transactionsEntity.setPrimaryCategory(transaction.getPrimaryCategory());
        transactionsEntity.setSecondaryCategory(transaction.getSecondaryCategory());
        transactionsEntity.setLogoUrl(transaction.getLogoUrl());
        transactionsEntity.setName(transaction.getName());
        transactionsEntity.setCategoryId(transaction.getCategoryId());
        transactionsEntity.setIsoCurrencyCode(transaction.getIsoCurrencyCodes());
        transactionsEntity.setMerchantName(transaction.getMerchantName());
        transactionsEntity.setAuthorizedDate(transaction.getAuthorizedDate());
        transactionsEntity.setCreateDate(LocalDate.now());
        return transactionsEntity;
    }

    private AccountEntity fetchAccountByAccountId(String accountId){
        Optional<AccountEntity> accountEntity = accountRepository.findByAccountId(accountId);
        if(accountEntity.isEmpty()){
            throw new AccountNotFoundException("Account with account id " + accountId + " not found");
        }
        return accountEntity.get();
    }
}
