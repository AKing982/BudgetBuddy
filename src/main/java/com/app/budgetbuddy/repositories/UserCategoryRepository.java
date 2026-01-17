package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.UserCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface UserCategoryRepository extends JpaRepository<UserCategoryEntity, Integer>
{

}
