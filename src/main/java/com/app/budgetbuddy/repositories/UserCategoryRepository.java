package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.UserCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserCategoryRepository extends JpaRepository<UserCategoryEntity, Integer>
{
    @Query("SELECT c FROM UserCategoryEntity c WHERE c.isActive = TRUE and c.user.id =:userId")
    List<UserCategoryEntity> findAllByUser(@Param("userId") Long userId);

    @Query("SELECT c FROM UserCategoryEntity c WHERE c.user.id =:userId AND c.id =:id")
    UserCategoryEntity findByIdAndUser(@Param("userId") Long userId, @Param("id") Long id);
}
