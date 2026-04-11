package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;

public interface BPTemplateDetailsService extends ServiceModel<BPTemplateDetailEntity>
{
    void saveModel(BPTemplateDetail detail);
}
