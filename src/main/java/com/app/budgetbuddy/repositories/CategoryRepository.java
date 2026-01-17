package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.CategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<CategoryEntity, Long>
{
    @Query("SELECT c FROM CategoryEntity c WHERE c.category =:name")
    List<CategoryEntity> findByName(@Param("name") String name);


    @Query("SELECT c FROM CategoryEntity c WHERE c.id =:categoryId")
    Optional<CategoryEntity> findByCategoryId(@Param("categoryId") String categoryId);

    @Query("SELECT c FROM CategoryEntity c WHERE c.description LIKE :descr")
    Optional<CategoryEntity> findByDescription(@Param("descr") String descr);

//    @Query("SELECT c FROM CategoryEntity c WHERE c.id LIKE :num")
//    Optional<CategoryEntity> findByCategoryRefNumber(@Param("num") String num);

    @Query("SELECT c FROM CategoryEntity c WHERE c.description =:descr OR c.category =:name")
    Optional<CategoryEntity> findByDescriptionOrCategoryName(@Param("descr") String descr, @Param("name") String name);

//    @Query("""
//    SELECT c.id
//    FROM CategoryEntity c
//    WHERE (
//        (c.category NOT NULL AND (c.name = :name OR LOWER(c.category) LIKE LOWER(CONCAT('%', :name, '%'))))
//        OR
//        (c.category IS NULL AND c.description IS NOT NULL AND LOWER(c.description) LIKE LOWER(CONCAT('%', :name, '%')))
//    )
//    AND c.isActive = true
//    ORDER BY
//        CASE WHEN c.category = :name THEN 0
//             WHEN c.category LIKE :name THEN 1
//             ELSE 2
//        END
//    LIMIT 1
//    """)
//    Optional<String> findCategoryIdByName(@Param("name") String name);
}
