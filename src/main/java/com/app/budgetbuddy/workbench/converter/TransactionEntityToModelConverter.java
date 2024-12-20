package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.TransactionsEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class TransactionEntityToModelConverter implements Converter<TransactionsEntity, Transaction>
{
    @Override
    public Transaction convert(TransactionsEntity transactionsEntity) {
//        log.info("Converting TransactionsEntity to Transaction: {}", transactionsEntity.toString());
        String categoryName = (transactionsEntity.getCategory() == null)
                ? ""
                : (transactionsEntity.getCategory().getName() != null
                ? transactionsEntity.getCategory().getName()
                : (transactionsEntity.getCategory().getDescription() != null
                ? transactionsEntity.getCategory().getDescription()
                : ""));
//        log.info("Category Name: {}", categoryName);
//        log.info("Transaction Description: {}", transactionsEntity.getDescription());
        List<String> categories = categoryName.equals("Unknown") ? List.of() : List.of(categoryName);

        try {
            return new Transaction(
                    transactionsEntity.getAccount().getId(),
                    transactionsEntity.getAmount(),
                    transactionsEntity.getIsoCurrencyCode(),
                    categories,
                    transactionsEntity.getCategory().getId(),
                    transactionsEntity.getCreateDate(),
                    transactionsEntity.getDescription(),
                    transactionsEntity.getMerchantName(),
                    transactionsEntity.getMerchantName(),
                    transactionsEntity.isPending(),
                    transactionsEntity.getId(),
                    transactionsEntity.getAuthorizedDate(),
                    transactionsEntity.getLogoUrl(),
                    transactionsEntity.getPosted()
            );
        }catch(Exception e) {
            log.error("There was an error while converting the TransactionsEntity", e);
            return null;

        }
    }
}
