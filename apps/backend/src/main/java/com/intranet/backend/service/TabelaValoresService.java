package com.intranet.backend.service;

import com.intranet.backend.dto.TabelaValoresCreateDto;
import com.intranet.backend.dto.TabelaValoresDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.UUID;

public interface TabelaValoresService {

    List<TabelaValoresDto> getTabelasByConvenioId(UUID convenioId);

    Page<TabelaValoresDto> getAllTabelas(Pageable pageable);

    TabelaValoresDto getTabelaById(UUID id);

    List<TabelaValoresDto> getTabelasByCurrentUser();

    TabelaValoresDto createTabela(TabelaValoresCreateDto tabelaCreateDto);

    TabelaValoresDto updateTabela(UUID id, TabelaValoresCreateDto tabelaUpdateDto);

    void deleteTabela(UUID id);

    long countTabelasByConvenioId(UUID convenioId);
}
