package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.entities.BPTemplatePointerEntity;
import com.app.budgetbuddy.exceptions.BPTemplateBuilderException;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import com.app.budgetbuddy.services.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class BPTemplatePersistenceService
{
    private final BPTemplateService bpTemplateService;
    private final BPTemplateDetailsService bpTemplateDetailsService;
    private final BPTemplatePointerService bpTemplatePointerService;
    private final BPColumnService bpColumnService;
    private final BPCategoryService bpCategoryService;

    @Autowired
    public BPTemplatePersistenceService(BPTemplateService bpTemplateService,
                                        BPTemplateDetailsService bpTemplateDetailsService,
                                        BPTemplatePointerService bpTemplatePointerService,
                                        BPColumnService bpColumnService,
                                        BPCategoryService bpCategoryService)
    {
        this.bpTemplateService = bpTemplateService;
        this.bpTemplateDetailsService = bpTemplateDetailsService;
        this.bpTemplatePointerService = bpTemplatePointerService;
        this.bpColumnService = bpColumnService;
        this.bpCategoryService = bpCategoryService;
    }

    public BPTemplateDetail findTemplateDetailByTemplateId(Long templateId)
    {
        return bpTemplateDetailsService.findByTemplateId(templateId)
                .orElseThrow(() -> new TemplateDetailException("Budget template detail not found"));
    }

    @Transactional
    public BPTemplateEntity persistNewTemplate(BPTemplate template, BPTemplatePointer pointer, Long userId)
    {
        BPTemplateDetail detail = template.getBpTemplateDetail();
        if(detail == null)
        {
            throw new TemplateDetailException("Template detail cannot be null");
        }
        BPTemplateEntity savedTemplate = bpTemplateService.saveTemplate(template, userId);
        BPTemplatePointerEntity savedPointer = savePointer(pointer);
        BPTemplateDetailEntity savedDetail = bpTemplateDetailsService.saveModel(detail, savedTemplate, savedPointer);
        List<BPColumnEntity> savedColumns = bpColumnService.saveColumns(detail.getLayoutGrid().columns(), savedDetail);
        bpCategoryService.saveCategories(detail.getLayoutGrid().rows(), savedColumns);
        return savedTemplate;
    }

    @Transactional
    public void persistFuturePointerMove(Long templateDetailId, List<BPColumn> newColumns, BPTemplatePointer movedPointer)
    {
        BPTemplateDetailEntity detailEntity = bpTemplateDetailsService.findById(templateDetailId)
                .orElseThrow(() -> new TemplateDetailException("Template detail not found"));

        if(!newColumns.isEmpty())
        {
            List<BPColumnEntity> savedColumns = bpColumnService.saveColumns(newColumns, detailEntity);
            List<BPColumnEntity> allColumns = new ArrayList<>(
                    detailEntity.getColumns() == null ? List.of() : detailEntity.getColumns());
            allColumns.addAll(savedColumns);
            detailEntity.setColumns(allColumns);
        }
        savePointer(movedPointer);
    }

    @Transactional
    public void saveCategoryChanges(List<BPCategory> updatedCategories, List<BPCategory> missingCategories, Long templateDetailId)
    {
        bpCategoryService.updateCategories(updatedCategories);
        if(!missingCategories.isEmpty())
        {
            bpCategoryService.saveNewTemplateCategories(missingCategories, templateDetailId);
        }
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private BPTemplatePointerEntity savePointer(BPTemplatePointer pointer)
    {
        return bpTemplatePointerService.createAndSaveToEntity(pointer)
                .orElseThrow(() -> new BPTemplateBuilderException("Error saving template pointer"));
    }
}
