package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.BPCellEntity;

public interface BPCellService extends ServiceModel<BPCellEntity>
{
    void updateCellAmount(Long id, Double amount);
}
