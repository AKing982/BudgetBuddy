package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.CategoryRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Collections;
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
//        if(categories == null || categoryId == null){
//            return null;
//        }
//
//        Optional<CategoryEntity> existingCategory = categoryRepository.findByCategoryId(categoryId);
//        return existingCategory.orElseGet(() -> {
//            String mainCategory = categories.get(0);
//            String subCategory = categories.size() > 1 ? categories.get(1) : null;
//            return categoryRepository.save(createCategory(categoryId, false, subCategory, mainCategory, LocalDateTime.now(), 0L));
//        });
        return null;
    }

    @Override
    @Transactional
    public Optional<CategoryEntity> findCategoryById(Long categoryId)
    {
        return categoryRepository.findByCategoryId(categoryId);
    }

    @Override
    @Transactional
    public List<CategoryEntity> findAllSystemCategories()
    {
        try
        {
            return categoryRepository.findAllSystemCategories();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the system categories: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public Optional<CategoryEntity> findCategoryByName(String categoryName)
    {
        return categoryRepository.findByName(categoryName);
    }

    @Override
    public Optional<CategoryEntity> getCategoryByNameOrDescription(String description, String name) {
        return categoryRepository.findByDescriptionOrCategoryName(description, name);
    }

    @Override
    @Transactional
    public Long getCategoryIdByName(String categoryName)
    {
        if(categoryName == null)
        {
            return 0L;
        }
        try
        {
            Optional<CategoryEntity> categoryEntityOptional = categoryRepository.findByName(categoryName);
            if(categoryEntityOptional.isEmpty())
            {
                return 0L;
            }
            CategoryEntity categoryEntity = categoryEntityOptional.get();
            return categoryEntity.getId();
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the system categories: ", e);
            return 0L;
        }
    }

    private CategoryEntity createCategory(String categoryId, boolean isCustom, String name, String description, LocalDateTime created, Long id) {
        CategoryEntity categoryEntity = new CategoryEntity();
        categoryEntity.setId(id);
//        categoryEntity.setCustom(isCustom);
        if(name == null)
        {
            categoryEntity.setCategory("");
        }
        else
        {
            categoryEntity.setCategory(name);
        }
        categoryEntity.setDescription(description);
        categoryEntity.setCreatedat(created);
        return categoryEntity;
    }
}
