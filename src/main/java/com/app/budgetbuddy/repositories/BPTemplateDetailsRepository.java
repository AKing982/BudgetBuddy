package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BPTemplateDetailsRepository extends JpaRepository<BPTemplateDetailEntity, Long>
{
    @Query("SELECT bpd FROM BPTemplateDetailEntity bpd WHERE bpd.bpTemplate.id =:id AND bpd.enableSync = true")
    BPTemplateDetailEntity findByBpTemplateId(@Param("id") Long id);
}
