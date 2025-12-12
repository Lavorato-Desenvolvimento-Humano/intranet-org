// src/main/java/com/intranet/backend/model/UserEquipe.java
package com.intranet.backend.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_equipes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class UserEquipe {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "equipe_id", nullable = false)
    @ToString.Exclude 
    private Equipe equipe;
}