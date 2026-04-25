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
import java.util.Optional;

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

    @Query("SELECT bc FROM BPCategoryEntity bc WHERE bc.category = :category AND bc.startDate = :startDate AND bc.endDate = :endDate")
    Optional<BPCategoryEntity> findByCategoryAndStartDateAndEndDate(
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    @Modifying
    @Transactional
    @Query("UPDATE BPCategoryEntity bc SET bc.actualAmount =:actualAmount WHERE bc.id =:id")
    int updateActualAmountById(
            @Param("id") Long id,
            @Param("actualAmount") BigDecimal actualAmount
    );

    @Modifying
    @Query("UPDATE BPCategoryEntity bc SET bc.plannedAmount =:planned WHERE bc.category =:category AND bc.startDate =:start AND bc.endDate =:end")
    void updatePlannedAmountByCategoryAndDateRange(
            @Param("category") String category,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            @Param("planned") BigDecimal planned
    );


}
