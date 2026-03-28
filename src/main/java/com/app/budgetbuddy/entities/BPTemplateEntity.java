package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.BPTemplateType;
import com.app.budgetbuddy.domain.Period;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.jetbrains.annotations.NotNull;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="sub_budgetid")
    private SubBudgetEntity subBudget;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="goalId")
    private SubBudgetGoalsEntity subBudgetGoals;

    @OneToOne(mappedBy="bpTemplate", cascade=CascadeType.ALL)
    private BPTemplateDetailEntity bpTemplateDetail;

    @Column(name="bp-template-type")
    @Enumerated(EnumType.STRING)
    private BPTemplateType bpTemplateType;

    @Column(name="period")
    @Enumerated(EnumType.STRING)
    private Period period;

    @Column(name="isActive")
    private boolean active;

    @Column(name="is_custom_template")
    private boolean isCustomTemplate;

    @Column(name="is_saved")
    private boolean isSaved;
}
