package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.entities.BPTemplatePointerEntity;

import java.util.Optional;

public interface BPTemplateDetailsService extends ServiceModel<BPTemplateDetailEntity>
{
    BPTemplateDetailEntity saveModel(BPTemplateDetail detail, BPTemplateEntity template, BPTemplatePointerEntity bpTemplatePointerEntity);
    Optional<BPTemplateDetail> findByTemplateId(Long id);
}
