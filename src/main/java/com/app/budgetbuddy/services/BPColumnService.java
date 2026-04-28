package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPColumn;
import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;

import java.util.List;

public interface BPColumnService extends ServiceModel<BPColumnEntity>
{
    List<BPColumnEntity> saveColumns(List<BPColumn> columns, BPTemplateDetailEntity detail);
    void deleteColumnsByDetailEntity(BPTemplateDetailEntity detail);
}
