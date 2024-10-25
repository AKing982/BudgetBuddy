package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.UserBudgetCategoryEntity;
import com.app.budgetbuddy.repositories.UserBudgetCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class UserBudgetCategoryServiceImpl implements UserBudgetCategoryService
{
    private final UserBudgetCategoryRepository userBudgetCategoryRepository;

    @Autowired
    public UserBudgetCategoryServiceImpl(UserBudgetCategoryRepository userBudgetCategoryRepository)
    {
        this.userBudgetCategoryRepository = userBudgetCategoryRepository;
    }

    @Override
    public Collection<UserBudgetCategoryEntity> findAll() {
        return userBudgetCategoryRepository.findAll();
    }

    @Override
    public void save(UserBudgetCategoryEntity userBudgetCategoryEntity) {
        userBudgetCategoryRepository.save(userBudgetCategoryEntity);
    }

    @Override
    public void delete(UserBudgetCategoryEntity userBudgetCategoryEntity) {
        userBudgetCategoryRepository.delete(userBudgetCategoryEntity);
    }

    @Override
    public Optional<UserBudgetCategoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<UserBudgetCategoryEntity> getAllUserBudgetsByUser(Long userId) {
        return userBudgetCategoryRepository.findAllByUserId(userId);
    }

    @Override
    public List<UserBudgetCategoryEntity> getActiveUserBudgetCategoriesByUser(Long userId) {
        return userBudgetCategoryRepository.findActiveCategoriesByUser(userId);
    }

    @Override
    public List<UserBudgetCategoryEntity> getUserBudgetCategoriesByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return userBudgetCategoryRepository.findCategoriesByUserAndDateRange(userId, startDate, endDate);
    }

    @Override
    public Integer getTotalBudgetAmountSumByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return userBudgetCategoryRepository.sumBudgetedAmountByUserAndDateRange(userId, startDate, endDate);
    }
}

