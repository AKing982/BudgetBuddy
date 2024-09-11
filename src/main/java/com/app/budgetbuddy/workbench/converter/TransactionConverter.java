package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.AccountNotFoundException;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.plaid.client.model.Transaction;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

@Component
public class TransactionConverter implements Converter<PlaidTransaction, TransactionsEntity>
{
    private final AccountRepository accountRepository;

    @Autowired
    public TransactionConverter(AccountRepository accountRepository){
        this.accountRepository = accountRepository;
    }

    @Override
    public TransactionsEntity convert(PlaidTransaction transaction) {
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setPending(transaction.getPending());
        transactionsEntity.setAmount(transaction.getAmount());
        transactionsEntity.setAccount(fetchAccountByAccountId(transaction.getAccountId()));
        transactionsEntity.setDescription(transaction.getDescription());
        transactionsEntity.setAuthorizedDate(transaction.getAuthorizedDate());
        transactionsEntity.setCategoryId(transaction.getCategoryId());
//        transactionsEntity.setCategories(transaction.getCategory());
        transactionsEntity.setPosted(transaction.getDate());
        transactionsEntity.setMerchantName(transaction.getMerchantName());
        transactionsEntity.setCreateDate(LocalDate.now());
        transactionsEntity.setLogoUrl(transaction.getLogo());
        transactionsEntity.setIsoCurrencyCode(transaction.getIsoCurrencyCode());
        transactionsEntity.setTransactionReferenceNumber(transaction.getTransactionId());
//        transactionsEntity.setPersonalFinanceCategory(null);
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
