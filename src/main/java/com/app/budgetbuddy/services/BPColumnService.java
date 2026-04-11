package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPColumn;
import com.app.budgetbuddy.entities.BPColumnEntity;

import java.util.List;

public interface BPColumnService extends ServiceModel<BPColumnEntity>
{
    void saveColumns(List<BPColumn> columns);
}
