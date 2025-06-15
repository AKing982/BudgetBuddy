package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.Set;

@Entity
@Table(name="bp_templates")
@Getter
@Setter
public class BPTemplateEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name="id")
    private Set<BudgetScheduleRangeEntity> budgetWeeks;

    @Column(name="category")
    private Set<String> categories;





}
