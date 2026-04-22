package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.BPLayoutType;
import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_id")
    private BPTemplateEntity bpTemplate;

    @Column(name="layout_type")
    @Enumerated(EnumType.STRING)
    private BPLayoutType layoutType;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @Column(name="last_updated")
    private LocalDateTime lastUpdated;

    @Column(name="enable_sync")
    private boolean enableSync;

    @OneToMany(mappedBy="bpTemplateDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPColumnEntity> columns = new ArrayList<>();

    @OneToMany(mappedBy="bpTemplateDetail", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPCategoryEntity> budgetCategories = new ArrayList<>();
}
