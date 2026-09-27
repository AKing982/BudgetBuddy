package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BPTemplatePointer;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.PointerMode;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplatePointerEntity;
import com.app.budgetbuddy.exceptions.BPTemplatePointerException;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BPTemplatePointerRepository;
import com.app.budgetbuddy.workbench.converter.BPTemplatePointerToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplatePointerServiceImpl implements BPTemplatePointerService
{
    private final BPTemplatePointerRepository bpTemplatePointerRepository;
    private final BPTemplatePointerToEntityConverter bpTemplatePointerToEntityConverter;

    @Autowired
    public BPTemplatePointerServiceImpl(BPTemplatePointerRepository bpTemplatePointerRepository,
                                        BPTemplatePointerToEntityConverter bpTemplatePointerToEntityConverter)
    {
        this.bpTemplatePointerRepository = bpTemplatePointerRepository;
        this.bpTemplatePointerToEntityConverter = bpTemplatePointerToEntityConverter;
    }

    @Override
    public Collection<BPTemplatePointerEntity> findAll() {
        return List.of();
    }

    @Override
    public void save(BPTemplatePointerEntity bpTemplatePointerEntity) {

    }

    @Override
    public void delete(BPTemplatePointerEntity bpTemplatePointerEntity) {

    }

    @Override
    public Optional<BPTemplatePointerEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public Optional<BPTemplatePointer> createAndSave(BPTemplatePointer bpTemplatePointer)
    {
        try
        {
            BPTemplatePointerEntity entity = bpTemplatePointerToEntityConverter.convert(bpTemplatePointer);
            BPTemplatePointerEntity savedEntity = bpTemplatePointerRepository.save(entity);
            bpTemplatePointer.setId(savedEntity.getId());
            return Optional.of(bpTemplatePointer);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget template pointer", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<BPTemplatePointerEntity> createAndSaveToEntity(BPTemplatePointer bpTemplatePointer)
    {
        try
        {
            BPTemplatePointerEntity convertedEntity = bpTemplatePointerToEntityConverter.convert(bpTemplatePointer);
            BPTemplatePointerEntity savedEntity = bpTemplatePointerRepository.save(convertedEntity);
            return Optional.of(savedEntity);
        }catch(DataAccessException e){
            log.error("There was an error saving the budget template pointer", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public Optional<BPTemplatePointer> findByDateRangeAndTemplateDetailID(Long templateDetailId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            BPTemplatePointerEntity bpTemplatePointerEntity = bpTemplatePointerRepository.findByBpTemplateDetailIdAndRange(templateDetailId, startDate, endDate)
                    .orElseThrow(() -> new BPTemplatePointerException("No budget template pointer found for the given template detail id and date range"));
            DateRange dateRange = DateRange.createDateRangeByStrings(bpTemplatePointerEntity.getRangeStartDate(), bpTemplatePointerEntity.getRangeEndDate());
            BPTemplatePointer bpTemplatePointer = BPTemplatePointer.builder()
                    .pointerMode(PointerMode.valueOf(bpTemplatePointerEntity.getPointerMode()))
                    .templateDetailId(templateDetailId)
                    .currentDateRange(dateRange)
                    .isUpdateEnabled(bpTemplatePointerEntity.isUpdateEnabled())
                    .isLocked(bpTemplatePointerEntity.isLocked())
                    .status(bpTemplatePointerEntity.getStatus())
                    .build();
            return Optional.of(bpTemplatePointer);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the budget template pointer", e);
            return Optional.empty();
        }
    }


}
