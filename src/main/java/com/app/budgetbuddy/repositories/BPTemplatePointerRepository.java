package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPTemplatePointerEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface BPTemplatePointerRepository extends JpaRepository<BPTemplatePointerEntity, Long>
{
    @Query("SELECT bpt FROM BPTemplatePointerEntity bpt WHERE bpt.bpTemplateDetail.id =:id AND bpt.rangeStartDate =:start AND bpt.rangeEndDate =:end")
    Optional<BPTemplatePointerEntity> findByBpTemplateDetailIdAndRange(@Param("id") Long id, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT bpt FROM BPTemplatePointerEntity bpt WHERE bpt.bpTemplateDetail.id =:id")
    List<BPTemplatePointerEntity> findByBpTemplateDetailId(@Param("id") Long id);
}
