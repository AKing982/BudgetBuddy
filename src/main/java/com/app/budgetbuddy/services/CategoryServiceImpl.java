package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collection;
import java.util.Optional;

@Service
public class CategoryServiceImpl implements CategoryService
{
    private final CategoryRepository categoryRepository;

    @Autowired
    public CategoryServiceImpl(CategoryRepository categoryRepository)
    {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public Collection<CategoryEntity> findAll() {
        return categoryRepository.findAll();
    }

    @Override
    public void save(CategoryEntity categoryEntity) {
        categoryRepository.save(categoryEntity);
    }

    @Override
    public void delete(CategoryEntity categoryEntity) {
        categoryRepository.delete(categoryEntity);
    }

    @Override
    public Optional<CategoryEntity> findById(Long id) {
        return categoryRepository.findById(id);
    }

    @Override
    public CategoryEntity createAndSaveCategory(String categoryId, String categoryName, String description) {
        return null;
    }
}
