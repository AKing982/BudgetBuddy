package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="bp_category_groups")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPCategoryGroupEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_detail_id")
    private BPTemplateDetailEntity bpTemplateDetail;

    @Column(name="group_name")
    private String groupName;

    @OneToMany(mappedBy="categoryGroup", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<BPCategoryGroupMemberEntity> members = new ArrayList<>();

}
