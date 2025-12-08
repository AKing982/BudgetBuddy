package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;

import java.util.List;

public interface CSVAccountService extends ServiceModel<CSVAccountEntity>
{
    List<CSVAccountEntity> createCSVAccountEntities(List<AccountCSV> accountCSVList);
    void saveAllCSVAccountEntities(List<CSVAccountEntity> csvAccountEntities);
}
