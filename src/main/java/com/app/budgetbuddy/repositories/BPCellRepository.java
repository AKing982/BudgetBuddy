package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPCellEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BPCellRepository extends JpaRepository<BPCellEntity, Long>
{
    @Modifying
    @Query("UPDATE BPCellEntity c SET c.amount =:amount WHERE c.id =:id")
    void updateBPCellAmount(@Param("id") Long id, @Param("amount") Double amount);
}
