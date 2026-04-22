package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface BPBudgetCategoryRepository extends JpaRepository<BPCategoryEntity, Long>
{
    @Query("SELECT bc FROM BPCategoryEntity bc WHERE bc.bpTemplateDetail.id =:id")
    List<BPCategoryEntity> findByBpTemplateDetailId(@Param("id") Long id);

    @Modifying
    @Transactional
    @Query("UPDATE BPCategoryEntity bc SET bc.actualAmount = :actualAmount WHERE bc.category = :category AND bc.startDate = :startDate AND bc.endDate = :endDate")
    void updateActualAmountByCategoryAndDateRange(
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("actualAmount") BigDecimal actualAmount
    );

}
