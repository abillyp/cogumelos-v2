/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.billy@organico4you.com.br
 */

package com.cogumelos.service;

import com.cogumelos.domain.*;
import com.cogumelos.dto.experimento.ExperimentoRequest;
import com.cogumelos.dto.experimento.ExperimentoResponse;
import com.cogumelos.enums.Fase;
import com.cogumelos.repository.*;
import com.cogumelos.security.TenantContext;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExperimentoServiceTest {

    @Mock ExperimentoRepository repo;
    @Mock FormulacaoRepository formulacaoRepo;
    @Mock UsuarioRepository usuarioRepo;
    @Mock LoteMonitoramentoRepository monitoramentoRepo;
    @Mock ColheitaRepository colheitaRepo;
    @Mock InsumoRepository insumoRepo;

    @InjectMocks
    ExperimentoService service;

    @AfterEach
    void limpar() {
        TenantContext.clear();
    }

    // ── helpers ──────────────────────────────────────────────

    private Experimento experimento(String id, Long tenantId) {
        Usuario u = new Usuario();
        u.setId("user-1");
        u.setNome("Produtor");

        EspecieCogumelo especie = new EspecieCogumelo();
        especie.setId("esp-1");
        especie.setNome("Shiitake");
        especie.setCnMin(20.0);
        especie.setCnMax(40.0);

        Formulacao f = new Formulacao();
        f.setId("form-1");
        f.setNome("Substrato A");
        f.setEspecie(especie);
        f.setInsumos(List.of());

        Experimento e = new Experimento();
        e.setId(id);
        e.setTenantId(tenantId);
        e.setFaseAtual(Fase.PREPARACAO);
        e.setTotalBlocos(10);
        e.setUsuario(u);
        e.setFormulacao(f);

        return e;
    }

    // ── testes de isolamento ──────────────────────────────────

    @Test
    void deveListarSomenteExperimentosDoTenantAtual() {
        TenantContext.setTenantId(1L);

        Experimento expTenant1 = experimento("exp-1", 1L);
        when(repo.findByTenantIdOrderByDataPreparoDesc(1L))
                .thenReturn(List.of(expTenant1));
        when(colheitaRepo.findByExperimentoIdAndTenantId(any(), eq(1L)))
                .thenReturn(List.of());

        List<ExperimentoResponse> resultado = service.listar();

        assertThat(resultado).hasSize(1);
        // confirma que buscou pelo tenant correto
        verify(repo).findByTenantIdOrderByDataPreparoDesc(1L);
        verify(repo, never()).findByTenantIdOrderByDataPreparoDesc(2L);
    }

    @Test
    void naoDeveBuscarExperimentoDeOutroTenant() {
        TenantContext.setTenantId(1L);

        // tenant 2 tem esse experimento — tenant 1 não deve ver
        when(repo.findByIdAndTenantId("exp-do-tenant-2", 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.buscar("exp-do-tenant-2"))
                .isInstanceOf(Exception.class);
    }

    @Test
    void deveBuscarExperimentoDoProprioTenant() {
        TenantContext.setTenantId(1L);

        Experimento e = experimento("exp-1", 1L);
        when(repo.findByIdAndTenantId("exp-1", 1L)).thenReturn(Optional.of(e));
        when(colheitaRepo.findByExperimentoIdAndTenantId("exp-1", 1L))
                .thenReturn(List.of());

        ExperimentoResponse response = service.buscar("exp-1");
        assertThat(response).isNotNull();
    }

    @Test
    void deveCriarExperimentoComTenantIdCorreto() {
        TenantContext.setTenantId(5L);

        Usuario u = new Usuario();
        u.setId("user-1");
        u.setNome("Produtor");

        EspecieCogumelo especie = new EspecieCogumelo();
        especie.setId("esp-1");
        especie.setNome("Shiitake");
        especie.setCnMin(20.0);
        especie.setCnMax(40.0);

        Formulacao f = new Formulacao();
        f.setId("form-1");
        f.setNome("Substrato A");
        f.setEspecie(especie);
        f.setInsumos(List.of());

        ExperimentoRequest req = new ExperimentoRequest(
                "form-1", "EXP-2024-001",
                java.time.LocalDate.now(), 10, 1.5, null, null
        );

        when(usuarioRepo.findById("user-1")).thenReturn(Optional.of(u));
        when(formulacaoRepo.findByIdAndTenantId("form-1", 5L)).thenReturn(Optional.of(f));
        when(repo.existsByCodigoAndTenantId("EXP-2024-001", 5L)).thenReturn(false);
        when(repo.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(colheitaRepo.findByExperimentoIdAndTenantId(any(), eq(5L)))
                .thenReturn(List.of());

        service.criar(req, "user-1");

        // verifica que o experimento foi salvo com o tenantId correto
        ArgumentCaptor<Experimento> captor = ArgumentCaptor.forClass(Experimento.class);
        verify(repo).save(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(5L);
    }

    @Test
    void naoDeveCriarExperimentoComCodigoDuplicadoNoMesmoTenant() {
        TenantContext.setTenantId(1L);

        Usuario u = new Usuario();
        u.setId("user-1");

        Formulacao f = new Formulacao();
        f.setId("form-1");

        ExperimentoRequest req = new ExperimentoRequest(
                "form-1", "EXP-2024-001",
                java.time.LocalDate.now(), 10, 1.5, null, null
        );

        when(usuarioRepo.findById("user-1")).thenReturn(Optional.of(u));
        when(formulacaoRepo.findByIdAndTenantId("form-1", 1L)).thenReturn(Optional.of(f));
        when(repo.existsByCodigoAndTenantId("EXP-2024-001", 1L)).thenReturn(true);

        assertThatThrownBy(() -> service.criar(req, "user-1"))
                .isInstanceOf(Exception.class)
                .hasMessageContaining("EXP-2024-001");
    }

    @Test
    void devePermitirMesmoCodigoEmTenantsDiferentes() {
        // tenant 1 cria EXP-2024-001
        TenantContext.setTenantId(1L);
        when(repo.existsByCodigoAndTenantId("EXP-2024-001", 1L)).thenReturn(false);
        assertThat(repo.existsByCodigoAndTenantId("EXP-2024-001", 1L)).isFalse();

        // tenant 2 também pode usar EXP-2024-001
        TenantContext.setTenantId(2L);
        when(repo.existsByCodigoAndTenantId("EXP-2024-001", 2L)).thenReturn(false);
        assertThat(repo.existsByCodigoAndTenantId("EXP-2024-001", 2L)).isFalse();
    }

    @Test
    void naoDeveUsarFormulacaoDeOutroTenant() {
        TenantContext.setTenantId(1L);

        Usuario u = new Usuario();
        u.setId("user-1");

        ExperimentoRequest req = new ExperimentoRequest(
                "form-do-tenant-2", "EXP-2024-001",
                java.time.LocalDate.now(), 10, 1.5, null, null
        );

        when(usuarioRepo.findById("user-1")).thenReturn(Optional.of(u));
        // tenant 1 não encontra formulação do tenant 2
        when(formulacaoRepo.findByIdAndTenantId("form-do-tenant-2", 1L))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.criar(req, "user-1"))
                .isInstanceOf(Exception.class);
    }
}