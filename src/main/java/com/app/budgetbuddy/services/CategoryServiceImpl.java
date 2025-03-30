package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.repositories.CategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
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

        Optional<CategoryEntity> existingCategory = categoryRepository.findByCategoryId(categoryId);
        return existingCategory.orElseGet(() -> {
            String mainCategory = categories.get(0);
            String subCategory = categories.size() > 1 ? categories.get(1) : null;
            return categoryRepository.save(createCategory(categoryId, false, subCategory, mainCategory, LocalDateTime.now(), 0L));
        });
    }

    @Override
    @Transactional
    public Optional<CategoryEntity> findCategoryById(String categoryId) {
        return categoryRepository.findByCategoryId(categoryId);
    }

    @Override
    public Optional<CategoryEntity> findCategoryByName(String categoryName) {
        List<CategoryEntity> categoryEntities = categoryRepository.findByName(categoryName);
        return categoryEntities.stream().findFirst();
    }

    @Override
    public Optional<CategoryEntity> getCategoryByNameOrDescription(String description, String name) {
        return categoryRepository.findByDescriptionOrCategoryName(description, name);
    }

    @Override
    public Optional<String> getCategoryIdByName(String categoryName) {
        return categoryRepository.findCategoryIdByName(categoryName);
    }

    private CategoryEntity createCategory(String categoryId, boolean isCustom, String name, String description, LocalDateTime created, Long id) {
        CategoryEntity categoryEntity = new CategoryEntity();
        categoryEntity.setId(categoryId);
        categoryEntity.setCustom(isCustom);
        if(name == null)
        {
            categoryEntity.setName("");
        }
        else
        {
            categoryEntity.setName(name);
        }
        categoryEntity.setDescription(description);
        categoryEntity.setCreatedat(created);
        categoryEntity.setCreatedBy(id);
        return categoryEntity;
    }
}
