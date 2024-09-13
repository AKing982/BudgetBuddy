package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, Long>
{
    @Query("SELECT c FROM CategoryEntity c WHERE c.name =:name")
    Optional<CategoryEntity> findByName(@Param("name") String name);

    @Query("SELECT c FROM CategoryEntity c WHERE c.description LIKE :descr")
    Optional<CategoryEntity> findByDescription(@Param("descr") String descr);

    @Query("SELECT c FROM CategoryEntity c WHERE c.categoryId LIKE :num")
    Optional<CategoryEntity> findByCategoryRefNumber(@Param("num") String num);


}
