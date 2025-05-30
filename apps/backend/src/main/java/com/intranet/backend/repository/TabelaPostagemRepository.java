package com.intranet.backend.repository;

import com.intranet.backend.model.TabelaPostagem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TabelaPostagemRepository extends JpaRepository<TabelaPostagem, UUID> {

}
