package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPCategoryGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BPCategoryGroupRepository extends JpaRepository<BPCategoryGroupEntity, Long>
{
    @Query("SELECT cge FROM BPCategoryGroupEntity cge JOIN cge.bpTemplateDetail.bpTemplate t WHERE cge.bpTemplateDetail.id =:id AND t.user.id =:userId")
    List<BPCategoryGroupEntity> findByBpTemplateDetailIdAndUserId(@Param("id") Long id, @Param("userId") Long userId);

    @Query("SELECT cge FROM BPCategoryGroupEntity cge WHERE cge.bpTemplateDetail.id =:id")
    List<BPCategoryGroupEntity> findByBpTemplateDetailId(@Param("id") Long id);
}

