package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.EntryType;
import com.app.budgetbuddy.domain.ModelType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Table(name="preCalculation_category_entities")
@Entity
@Getter
@Setter
public class PreCalculationCategoryEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="category")
    private String category;

    @Column(name="model_type")
    @Enumerated(EnumType.STRING)
    private ModelType modelType;

    @Column(name="mean_error")
    private double mean_error;

    @Column(name="isFit")
    private boolean isFit;

    @Column(name="pre_calculated_spending")
    private double pre_calculated_spending;

    @Column(name="pre_calculated_budgeted")
    private double pre_calculated_budgeted;

    @Column(name="pre_calculated_goals_met")
    private double pre_calculated_goals_met;

    @Column(name="pre_calculated_saved")
    private double pre_calculated_saved;

    @Column(name="is_over_spent")
    private boolean is_over_spent;

    @Column(name="entry_type")
    @Enumerated(EnumType.STRING)
    private EntryType entryType;



}
