package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.AccountNotFoundException;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.repositories.CategoryRepository;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
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
    public TransactionsEntity convert(Transaction transaction) {
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setAccount(fetchAccountByAccountId(transaction.accountId()));
        transactionsEntity.setId(transaction.transactionId());
        transactionsEntity.setPending(transaction.pending());
        transactionsEntity.setAmount(transaction.amount());
        transactionsEntity.setDescription(transaction.description());
        transactionsEntity.setPosted(transaction.posted());
        transactionsEntity.setCategory(createNewCategory(transaction.categoryId(), transaction.categories()));
        transactionsEntity.setLogoUrl(transaction.logoUrl());
        transactionsEntity.setIsoCurrencyCode(transaction.isoCurrencyCode());
        transactionsEntity.setMerchantName(transaction.merchantName());
        transactionsEntity.setAuthorizedDate(transaction.authorizedDate());
        transactionsEntity.setCreateDate(LocalDate.now());
        return transactionsEntity;
    }

    private CategoryEntity createNewCategory(String categoryId, List<String> categories){
        return categoryService.createAndSaveCategory(categoryId, categories);
    }


    private AccountEntity fetchAccountByAccountId(String accountId){
        Optional<AccountEntity> accountEntity = accountRepository.findByAccountId(accountId);
        if(accountEntity.isEmpty()){
            throw new AccountNotFoundException("Account with account id " + accountId + " not found");
        }
        return accountEntity.get();
    }
}
