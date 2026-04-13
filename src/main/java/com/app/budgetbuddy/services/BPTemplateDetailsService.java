package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;

public interface BPTemplateDetailsService extends ServiceModel<BPTemplateDetailEntity>
{
    BPTemplateDetailEntity saveModel(BPTemplateDetail detail, BPTemplateEntity template);
}
