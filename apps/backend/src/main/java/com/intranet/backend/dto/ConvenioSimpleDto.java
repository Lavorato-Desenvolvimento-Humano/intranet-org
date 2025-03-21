package com.intranet.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConvenioSimpleDto {
    private UUID id;
    private String name;
    private String description;
    private int postagemCount;
}