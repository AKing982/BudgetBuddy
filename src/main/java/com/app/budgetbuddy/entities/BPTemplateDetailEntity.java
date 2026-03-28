package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name="bp_template_details")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPTemplateDetailEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="id")
    private BPTemplateEntity bpTemplate;

    @Column(name="bp_type_name")
    @NotNull
    private String bpTypeName;

    @Column(name="is_classic")
    private boolean isClassic;

    @Column(name="is_visual")
    private boolean isVisual;

    @Column(name="is_saved")
    private boolean isSaved;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @Column(name="last_updated")
    private LocalDateTime lastUpdated;

    @OneToMany(mappedBy="bpTemplateDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPColumnEntity> columns = new ArrayList<>();

    @OneToMany(mappedBy="bpTemplateDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPRowEntity> rows = new ArrayList<>();

    @OneToMany(mappedBy="bpTemplateDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPBudgetCategoryEntity> budgetCategories = new ArrayList<>();

    @OneToMany(mappedBy="bpTemplateDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPCategoryGroupEntity> categoryGroups = new ArrayList<>();

    @OneToMany(mappedBy="bpTemplateDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPAccountBalanceEntity> accountBalances = new ArrayList<>();
}
