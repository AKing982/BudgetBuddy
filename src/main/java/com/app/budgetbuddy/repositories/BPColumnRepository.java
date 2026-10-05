package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPColumnEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface BPColumnRepository extends JpaRepository<BPColumnEntity, Long>
{
    @Query("SELECT bce FROM BPColumnEntity bce WHERE bce.columnIndex =:index AND bce.startDate =:start AND bce.endDate =:endDate")
    BPColumnEntity findByColumnIndexAndStartDateAndEndDate(@Param("index") int index, @Param("start") LocalDate start, @Param("endDate") LocalDate endDate);

    @Query("SELECT bce FROM BPColumnEntity bce WHERE bce.bpTemplateDetail.id =:id AND bce.startDate >= :start AND bce.endDate <= :end")
    List<BPColumnEntity> findByBpTemplateDetailIdAndRange(@Param("id") Long templateDetailId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT bce FROM BPColumnEntity bce WHERE bce.bpTemplateDetail.id =:id")
    List<BPColumnEntity> findByBpTemplateDetailId(@Param("id") Long id);

    @Modifying
    @Query("DELETE FROM BPColumnEntity bce WHERE bce.bpTemplateDetail.id =:id")
    void deleteByBpTemplateDetailId(@Param("id") Long id);
}
