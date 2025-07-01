package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor(access=AccessLevel.PUBLIC)
public class BPTemplateHeader implements Cloneable
{
    private Long headerId;
    private BPTemplateType bpTemplateType;
    private String headerName;

    public BPTemplateHeader(Long headerId, BPTemplateType bpTemplateType, String headerName)
    {
        this.headerId = headerId;
        this.bpTemplateType = bpTemplateType;
        this.headerName = headerName;
    }

    public BPTemplateHeader(String headerName)
    {
        this.headerName = headerName;
    }

    @Override
    public BPTemplateHeader clone() {
        try {
            // TODO: copy mutable state here, so the clone can't change the internals of the original
            return (BPTemplateHeader) super.clone();
        } catch (CloneNotSupportedException e) {
            throw new AssertionError();
        }
    }
}
