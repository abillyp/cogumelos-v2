/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.palma@organico4you.com.br
 */

package com.cogumelos.service;

import com.cogumelos.domain.*;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.enums.StatusFormulacao;
import com.cogumelos.repository.*;
import com.cogumelos.security.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class FormulacaoService {

    private final FormulacaoRepository repo;
    private final EspecieCogumeloRepository especieRepo;
    private final InsumoRepository insumoRepo;
    private final UsuarioRepository usuarioRepo;

    public FormulacaoService(FormulacaoRepository repo,
                             EspecieCogumeloRepository especieRepo,
                             InsumoRepository insumoRepo,
                             UsuarioRepository usuarioRepo) {
        this.repo        = repo;
        this.especieRepo = especieRepo;
        this.insumoRepo  = insumoRepo;
        this.usuarioRepo = usuarioRepo;
    }

    private Long tenantId() {
        return TenantContext.getTenantId();
    }

    private Formulacao buscarSeguro(String id) {
        return repo.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Formulação não encontrada"));
    }

    @Transactional(readOnly = true)
    public List<FormulacaoResponse> listar() {
        return repo.findByTenantIdOrderByCriadoEmDesc(tenantId())
                .stream().map(FormulacaoResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public FormulacaoResponse buscar(String id) {
        return FormulacaoResponse.from(buscarSeguro(id));
    }

    @Transactional
    public FormulacaoResponse criar(FormulacaoRequest req, String userId) {
        Long tid = tenantId();

        Usuario usuario = usuarioRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        EspecieCogumelo especie = especieRepo.findById(req.especieId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Espécie não encontrada"));

        Formulacao f = new Formulacao();
        f.setId(UUID.randomUUID().toString());
        f.setTenantId(tid);
        f.setUsuario(usuario);
        f.setNome(req.nome());
        f.setEspecie(especie);

        for (FormulacaoInsumoItem item : req.insumos()) {
            Insumo insumo = insumoRepo.findByIdAndTenantId(item.insumoId(), tid)
                    .orElseThrow(() -> new ResponseStatusException(
                            HttpStatus.NOT_FOUND, "Insumo não encontrado: " + item.insumoId()));

            FormulacaoInsumo fi = new FormulacaoInsumo();
            fi.setId(UUID.randomUUID().toString());
            fi.setTenantId(tid);
            fi.setFormulacao(f);
            fi.setInsumo(insumo);
            fi.setPesoRealKg(item.pesoRealKg());
            fi.setUmidadePct(item.umidadePct());
            f.getInsumos().add(fi);
        }

        f.recalcular();
        return FormulacaoResponse.from(repo.save(f));
    }

    @Transactional
    public FormulacaoResponse atualizarStatus(String id, String status) {
        Formulacao f = buscarSeguro(id);
        f.setStatus(StatusFormulacao.valueOf(status));
        return FormulacaoResponse.from(repo.save(f));
    }

    @Transactional
    public void deletar(String id) {
        buscarSeguro(id);
        repo.deleteById(id);
    }
}
