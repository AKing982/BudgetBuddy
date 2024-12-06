package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.repositories.TransactionCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class TransactionCategoryServiceImpl implements TransactionCategoryService
{
    private final TransactionCategoryRepository transactionCategoryRepository;

    @Autowired
    public TransactionCategoryServiceImpl(TransactionCategoryRepository transactionCategoryRepository)
    {
        this.transactionCategoryRepository = transactionCategoryRepository;
    }

    @Override
    public Collection<TransactionCategoryEntity> findAll() {
        return transactionCategoryRepository.findAll();
    }

    @Override
    public void save(TransactionCategoryEntity userBudgetCategoryEntity) {
        transactionCategoryRepository.save(userBudgetCategoryEntity);
    }

    @Override
    public void delete(TransactionCategoryEntity userBudgetCategoryEntity) {
        transactionCategoryRepository.delete(userBudgetCategoryEntity);
    }

    @Override
    public Optional<TransactionCategoryEntity> findById(Long id) {
        return Optional.empty();
    }


    @Override
    public List<TransactionCategoryEntity> getAllTransactionCategoriesByUser(Long userId) {
        return transactionCategoryRepository.findAllByUserId(userId);
    }

    @Override
    public List<TransactionCategoryEntity> getActiveTransactionCategoriesByUser(Long userId) {
        return transactionCategoryRepository.findActiveCategoriesByUser(userId);
    }

    @Override
    public List<TransactionCategoryEntity> getTransactionCategoriesByBudgetId(Long budgetId) {
        return transactionCategoryRepository.findByBudgetId(budgetId);
    }

    @Override
    public List<TransactionCategoryEntity> getTransactionCategoriesByBudgetIdAndDateRange(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return transactionCategoryRepository.findByBudgetIdAndDateRange(budgetId, startDate, endDate);
    }

    @Override
    public List<TransactionCategoryEntity> getTransactionCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return transactionCategoryRepository.sumBudgetedAmountByUserAndDateRange(userId, startDate, endDate);
    }
}

