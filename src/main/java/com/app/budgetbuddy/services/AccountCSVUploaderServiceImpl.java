package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@Qualifier("accountCSVUploaderService")
public class AccountCSVUploaderServiceImpl implements CSVUploaderService<TransactionCSV, AccountCSV, CSVAccountEntity>
{
    private final CSVAccountService csvAccountService;
    private final CSVAccountServiceImpl cSVAccountServiceImpl;

    @Autowired
    public AccountCSVUploaderServiceImpl(CSVAccountService csvAccountService,
                                         CSVAccountServiceImpl cSVAccountServiceImpl)
    {
        this.csvAccountService = csvAccountService;
        this.cSVAccountServiceImpl = cSVAccountServiceImpl;
    }

    @Override
    public Set<AccountCSV> createCSVList(List<TransactionCSV> csvList, Long userId)
    {
        if(csvList == null || csvList.isEmpty())
        {
            return Collections.emptySet();
        }
        Map<String, TransactionCSV> accountKeyMap = new HashMap<>();
        Set<AccountCSV> accountCSVList = new HashSet<>();
        for(TransactionCSV transactionCSV : csvList)
        {
            String accountNumber = transactionCSV.getAccount();
            int suffix = transactionCSV.getSuffix();
            String accountKey = accountNumber + "-" + suffix;
            if(!accountKeyMap.containsKey(accountKey))
            {
                accountKeyMap.put(accountKey, transactionCSV);
            }
            else
            {
                TransactionCSV existing = accountKeyMap.get(accountKey);
                if(transactionCSV.getTransactionDate().isAfter(existing.getTransactionDate()))
                {
                    accountKeyMap.put(accountKey, transactionCSV);
                }
            }
        }
        for(TransactionCSV txn : accountKeyMap.values())
        {
            AccountCSV accountCSV = new AccountCSV();
            accountCSV.setUserId(userId);
            accountCSV.setAccountNumber(txn.getAccount());
            accountCSV.setSuffix(txn.getSuffix());
            accountCSV.setBalance(txn.getBalance());
            if(txn.getSuffix() == 9)
            {
                accountCSV.setAccountName("CHECKING");
            }
            else if(txn.getSuffix() == 4)
            {
                accountCSV.setAccountName("SAVINGS");
            }
            accountCSVList.add(accountCSV);
        }
        return accountCSVList;
    }

    @Override
    public List<CSVAccountEntity> createEntityList(Set<AccountCSV> csvList)
    {
        if(csvList == null || csvList.isEmpty())
        {
            return Collections.emptyList();
        }
        return cSVAccountServiceImpl.createCSVAccountEntities(csvList);
    }

    @Override
    public void saveEntities(List<CSVAccountEntity> entities)
    {
        csvAccountService.saveAllCSVAccountEntities(entities);
    }
}
