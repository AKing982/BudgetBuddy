package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

@Entity
@Table(name="bp_template_headers")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPTemplateHeaderEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_id")
    private BPTemplateEntity bpTemplate;

    @Column(name="header_name")
    @NotNull
    private String headerName;

    public BPTemplateHeaderEntity(Long id, BPTemplateEntity bpTemplate, @NotNull String headerName)
    {
        this.id = id;
        this.bpTemplate = bpTemplate;
        this.headerName = headerName;
    }
}
