package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPCategoryGroupMemberEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPCategoryGroupMemberRepository extends JpaRepository<BPCategoryGroupMemberEntity, Long> {
}
