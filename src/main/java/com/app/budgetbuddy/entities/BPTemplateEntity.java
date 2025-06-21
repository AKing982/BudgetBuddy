package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.BPTemplateType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.jetbrains.annotations.NotNull;

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

    @Column(name="bp-template-type")
    @Enumerated(EnumType.STRING)
    private BPTemplateType bpTemplateType;

    @Column(name="template_name")
    @NotNull
    private String templateName;

    @Column(name="template_description")
    @NotNull
    private String templateDescription;

    @Column(name="isActive")
    private boolean active;
}
