package com.intranet.drive.file.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class FileUploadRequest {

    @NotNull(message = "Nome do arquivo é obrigatório")
    @Size(min = 1, max = 255, message = "Nome deve ter entre 1 e 255 caracteres")
    private String name;

    private Long folderId;

    private String description;

    // Construtores
    public FileUploadRequest() {}

    public FileUploadRequest(String name,Long folderId, String description) {
        this.name = name;
        this.folderId = folderId;
        this.description = description;
    }

    // Getters e Setters
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Long getFolderId() { return folderId; }
    public void setFolderId(Long folderId) { this.folderId = folderId; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
