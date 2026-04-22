package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPTemplate;
import com.app.budgetbuddy.entities.BPTemplateEntity;

import java.util.List;
import java.util.Optional;

public interface BPTemplateService extends ServiceModel<BPTemplateEntity>
{
    BPTemplateEntity saveTemplate(BPTemplate template, Long userId);

    List<BPTemplate> getAllUserBudgetTemplates(Long userId);

    Optional<BPTemplate> getTemplateByUserAndId(Long userId, Long templateId);

    Optional<BPTemplate> getUserTemplatesByType(Long userId, String templateType);
}
