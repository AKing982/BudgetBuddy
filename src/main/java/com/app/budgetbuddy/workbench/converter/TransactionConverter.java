package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.AccountNotFoundException;
import com.app.budgetbuddy.exceptions.CategoryNotFoundException;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.repositories.CategoryRepository;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Component
public class TransactionConverter implements Converter<PlaidTransaction, TransactionsEntity>
{
    private final AccountRepository accountRepository;
    private final CategoryService categoryService;

    @Autowired
    public TransactionConverter(AccountRepository accountRepository,
                                CategoryService categoryService){
        this.accountRepository = accountRepository;
        this.categoryService = categoryService;
    }

    @Override
    public TransactionsEntity convert(PlaidTransaction transaction) {
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setPending(transaction.getPending());
        transactionsEntity.setAmount(transaction.getAmount());
        transactionsEntity.setAccount(fetchAccountByAccountId(transaction.getAccountId()));
        transactionsEntity.setDescription(transaction.getDescription());
        transactionsEntity.setAuthorizedDate(transaction.getAuthorizedDate());
        transactionsEntity.setCategory(createNewCategory(transaction.getCategoryId(), transaction.getCategories()));
        transactionsEntity.setPosted(transaction.getDate());
        transactionsEntity.setMerchantName(transaction.getMerchantName());
        transactionsEntity.setCreateDate(LocalDate.now());
        transactionsEntity.setLogoUrl(transaction.getLogo());
        transactionsEntity.setIsoCurrencyCode(transaction.getIsoCurrencyCode());
        transactionsEntity.setId(transaction.getTransactionId());
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
