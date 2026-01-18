package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.UserCategory;
import com.app.budgetbuddy.entities.UserCategoryEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.UserCategoryRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class UserCategoryServiceImpl implements UserCategoryService
{
    private UserCategoryRepository userCategoryRepository;
    private UserRepository userRepository;

    @Autowired
    public UserCategoryServiceImpl(UserCategoryRepository userCategoryRepository,
                                   UserRepository userRepository)
    {
        this.userCategoryRepository = userCategoryRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Collection<UserCategoryEntity> findAll()
    {
        return userCategoryRepository.findAll();
    }

    @Override
    public void save(UserCategoryEntity userCategoryEntity)
    {
        try
        {
            userCategoryRepository.save(userCategoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the user category entity: ", e);
            throw new DataAccessException("There was an error saving the user category entity", e);
        }
    }

    @Override
    @Transactional
    public void delete(UserCategoryEntity userCategoryEntity)
    {
        try
        {
            userCategoryRepository.delete(userCategoryEntity);
        }catch(DataAccessException e){
            log.error("There was an error deleting the user category entity: ", e);
            throw new DataAccessException("There was an error deleting the user category entity", e);
        }
    }

    @Override
    public Optional<UserCategoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public List<UserCategory> findAllCategoriesByUser(Long userId)
    {
        try
        {
            List<UserCategoryEntity> userCategoryEntities = userCategoryRepository.findAllByUser(userId);
            return convertUserCategoryEntities(userCategoryEntities);
        }catch(DataAccessException e){
            log.error("There was an error retrieving all the user categories for the user with id: {}", userId, e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void deleteUserCategory(Long categoryId, Long userId)
    {
        try
        {

            UserCategoryEntity userCategoryEntity = userCategoryRepository.findByIdAndUser(userId, categoryId);
            log.info("Deleting user category with id: {} for the user with id: {}", categoryId, userId);
            delete(userCategoryEntity);
            log.info("Successfully deleted user category with id: {} for the user with id: {}", categoryId, userId);
        }catch(DataAccessException e){
            log.error("There was an error deleting the user category with id: {} for the user with id: {}", categoryId, userId, e);
            throw new DataAccessException("There was an error deleting the user category with id: " + categoryId + " for the user with id: " + userId, e);
        }
    }

    private List<UserCategory> convertUserCategoryEntities(List<UserCategoryEntity> userCategoryEntities)
    {
        return userCategoryEntities.stream()
                .map(userCategoryEntity -> {
                    return new UserCategory(userCategoryEntity.getId(),
                            userCategoryEntity.getCategory(),
                            userCategoryEntity.getUser().getId(),
                            userCategoryEntity.getIsActive(),
                            userCategoryEntity.getType(),
                            userCategoryEntity.getIsSystemOverride());
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Optional<UserCategory> addCustomUserCategory(String categoryName, Long userId)
    {
        try
        {
            UserEntity userEntity = userRepository.findById(userId).orElseThrow(() -> new DataAccessException("User not found"));
            UserCategoryEntity userCategoryEntity = UserCategoryEntity.builder()
                    .user(userEntity)
                    .category(categoryName)
                    .isActive(true)
                    .isSystemOverride(false)
                    .type("CUSTOM")
                    .build();
            userCategoryRepository.save(userCategoryEntity);
            Long categoryId = userCategoryEntity.getId();
            UserCategory userCategory = new UserCategory(categoryId, categoryName, userId, true, "CUSTOM", false);
            return Optional.of(userCategory);
        }catch(DataAccessException e){
            log.error("There was an error adding the custom user category: ", e);
            return Optional.empty();
        }
    }
}
