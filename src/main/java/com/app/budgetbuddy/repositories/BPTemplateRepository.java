package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BPTemplateRepository extends JpaRepository<BPTemplateEntity, Long>
{
    @Query("SELECT bpt FROM BPTemplateEntity bpt " +
            "LEFT JOIN FETCH bpt.bpTemplateDetail " +
            "WHERE bpt.user.id = :userId")
    List<BPTemplateEntity> findByUserId(@Param("userId") Long userId);

    @Query("SELECT bpt FROM BPTemplateEntity bpt WHERE bpt.user.id =:userId AND bpt.bpTemplateType =:type")
    Optional<BPTemplateEntity> findByUserIdAndType(@Param("userId") Long userId, @Param("type") String type);
}
