package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.UserCategory;
import com.app.budgetbuddy.entities.UserCategoryEntity;
import com.app.budgetbuddy.services.UserCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping(value="/api/user-category")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class UserCategoryController
{
    private final UserCategoryService userCategoryService;

    @Autowired
    public UserCategoryController(UserCategoryService userCategoryService)
    {
        this.userCategoryService = userCategoryService;
    }

    @GetMapping("/{userId}/categories")
    public ResponseEntity<List<UserCategory>> getAllCustomUserCategories(@PathVariable Long userId)
    {
        try
        {
            List<UserCategory> userCategories = userCategoryService.findAllCategoriesByUser(userId);
            return ResponseEntity.ok(userCategories);
        }catch(Exception e){
            log.error("There was an error retrieving all custom user categories for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{userId}/delete/{categoryId}")
    public ResponseEntity<Boolean> deleteCustomUserCategory(@PathVariable Long userId,
                                                            @PathVariable Long categoryId)
    {
        try
        {
            return null;
        }catch(Exception e){
            log.error("There was an error deleting a custom user category for user {} and category {}", userId, categoryId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{userId}/add")
    public ResponseEntity<UserCategory> addCustomUserCategory(@PathVariable Long userId,
                                                              @RequestParam String customCategory)
    {
        try
        {
            Optional<UserCategory> userCategoryOptional = userCategoryService.addCustomUserCategory(customCategory, userId);
            if(userCategoryOptional.isEmpty())
            {
                return ResponseEntity.notFound().build();
            }
            UserCategory userCategory = userCategoryOptional.get();
            return ResponseEntity.ok(userCategory);
        }catch(Exception e){
            log.error("There was an error adding a custom user category", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
