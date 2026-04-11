package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPCategoryGroupEntity;

import java.util.List;
import java.util.Optional;

public interface BPCategoryGroupService extends ServiceModel<BPCategoryGroupEntity>
{
    List<BPCategoryGroupEntity> findByTemplateDetailId(Long templateDetailId);
    List<BPCategoryGroupEntity> findCategoryGroupsByTemplateDetailIdAndUserId(Long templateDetailId, Long userId);
    Optional<BPCategoryGroupEntity> findByTemplateDetailIdAndName(Long templateDetailId, String name);
}
