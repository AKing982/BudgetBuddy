package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.UserCategoryEntity;
import com.app.budgetbuddy.repositories.UserCategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class UserCategoryServiceImpl implements UserCategoryService
{
    private UserCategoryRepository userCategoryRepository;

    @Autowired
    public UserCategoryServiceImpl(UserCategoryRepository userCategoryRepository)
    {
        this.userCategoryRepository = userCategoryRepository;
    }

    @Override
    public Collection<UserCategoryEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(UserCategoryEntity userCategoryEntity) {

    }

    @Override
    public void delete(UserCategoryEntity userCategoryEntity) {

    }

    @Override
    public Optional<UserCategoryEntity> findById(Long id) {
        return Optional.empty();
    }
}
