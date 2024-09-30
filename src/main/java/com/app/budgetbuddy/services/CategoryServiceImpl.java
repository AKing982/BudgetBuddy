package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.repositories.CategoryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
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
    public CategoryEntity createAndSaveCategory(String categoryId, List<String> categories) {
        if(categories == null || categoryId == null){
            return null;
        }

        // Does the category already exist in the database?
        Optional<CategoryEntity> existingCategory = categoryRepository.findByCategoryId(categoryId);
        return existingCategory.orElseGet(() -> categoryRepository.save(createCategory(categoryId, false, categories.get(1), categories.get(0), LocalDateTime.now(), 0L)));
    }

    @Override
    public Optional<CategoryEntity> findCategoryById(String categoryId) {
        return categoryRepository.findByCategoryId(categoryId);
    }

    private CategoryEntity createCategory(String categoryId, boolean isCustom, String name, String description, LocalDateTime created, Long id) {
        CategoryEntity categoryEntity = new CategoryEntity();
        categoryEntity.setId(categoryId);
        categoryEntity.setCustom(isCustom);
        categoryEntity.setName(name);
        categoryEntity.setDescription(description);
        categoryEntity.setCreatedat(created);
        categoryEntity.setCreatedBy(id);
        return categoryEntity;
    }
}
