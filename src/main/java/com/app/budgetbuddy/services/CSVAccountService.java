package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;

import java.util.List;
import java.util.Set;

public interface CSVAccountService extends ServiceModel<CSVAccountEntity>
{
    List<CSVAccountEntity> createCSVAccountEntities(Set<AccountCSV> accountCSVList);
    void saveAllCSVAccountEntities(List<CSVAccountEntity> csvAccountEntities);
}
