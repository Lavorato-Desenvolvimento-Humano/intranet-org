package com.intranet.drive.common.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;
import java.util.Set;

public class UserDto {
    private Long id;
    private String username;
    private String email;
    private String nome;

    @JsonProperty("roles")
    private Set<String> roles;

    @JsonProperty("authorities")
    private Set<String> authorities;

    private boolean enabled;
    private LocalDateTime lastLogin;

    //Construtores
    public UserDto() {}

    public UserDto(Long id, String username, String email, String nome) {
        this.id = id;
        this.username = username;
        this.email = email;
        this.nome = nome;
    }

    //Getters e Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }

    public Set<String> getRoles() { return roles; }
    public void setRoles(Set<String> roles) { this.roles = roles; }

    public Set<String> getAuthorities() { return authorities; }
    public void setAuthorities(Set<String> authorities) { this.authorities = authorities; }

    public boolean isEnabled() { return enabled; }
    public void setEnabled(boolean enabled) { this.enabled = enabled; }

    public LocalDateTime getLastLogin() { return lastLogin; }
    public void setLastLogin(LocalDateTime lastLogin) { this.lastLogin = lastLogin; }
}
