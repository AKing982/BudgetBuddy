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
        transactionsEntity.setAccount(fetchAccountByAccountId(transaction.getAccountId()));
        transactionsEntity.setId(transaction.getTransactionId());
        transactionsEntity.setPending(transaction.getPending());
        transactionsEntity.setAmount(transaction.getAmount());
        transactionsEntity.setDescription(transaction.getDescription());
        transactionsEntity.setPosted(transaction.getPosted());
        transactionsEntity.setCategory(createNewCategory(transaction.getCategoryId(), transaction.getCategories()));
        transactionsEntity.setLogoUrl(transaction.getLogoUrl());
        transactionsEntity.setIsoCurrencyCode(transaction.getIsoCurrencyCode());
        transactionsEntity.setMerchantName(transaction.getMerchantName());
        transactionsEntity.setAuthorizedDate(transaction.getAuthorizedDate());
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
