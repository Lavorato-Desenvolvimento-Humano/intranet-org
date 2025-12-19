package com.intranet.backend.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;
import java.util.UUID;

@Data
@EqualsAndHashCode(callSuper = false)
public class BulkStatusChangeRequest extends StatusChangeRequest {
    @NotEmpty(message = "A lista de IDs não pode estar vazia")
    private List<UUID> ids;
}