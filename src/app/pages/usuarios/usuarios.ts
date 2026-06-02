import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  HostListener,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Usuario, Atribuicao } from '../../models/usuarios.model';
import { UsuarioService } from '../../service/usuario.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class Usuarios implements OnInit {
  constructor(
    private router: Router,
    private usuarioService: UsuarioService,
    private cdr: ChangeDetectorRef,
    private elementRef: ElementRef
  ) {}

  Atribuicao = Atribuicao;

  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];

  termoBusca = '';
  menuFiltrosAberto = false;

  ordenacaoNomeAtiva = false;
  ordenacaoEmailAtiva = false;
  agrupamentoAtribuicaoAtivo = false;
  atribuicaoSelecionada = '';

  modalAberto = false;
  modalEdicaoAberto = false;
  modalDetalheAberto = false;

  usuarioDetalhe: Usuario | null = null;

  novoUsuario: Usuario = this.criarUsuarioVazio();
  usuarioEdicao: Usuario = this.criarUsuarioVazio();

  mensagemSistema = '';
  tipoMensagem: 'sucesso' | 'erro' = 'sucesso';
  private timeoutMensagem: any;

  ngOnInit(): void {
    this.carregarUsuarios();
  }

  @HostListener('document:click', ['$event'])
  fecharFiltrosAoClicarFora(event: MouseEvent): void {
    const elementoClicado = event.target as HTMLElement;

    const menuFiltros = this.elementRef.nativeElement.querySelector(
      '.filter-menu-area'
    );

    if (!menuFiltros?.contains(elementoClicado)) {
      this.menuFiltrosAberto = false;
    }
  }

  irParaHome(): void {
    this.router.navigate(['/home']);
  }

  alternarMenuFiltros(): void {
    this.menuFiltrosAberto = !this.menuFiltrosAberto;
  }

  ordenarPorNome(): void {
    this.ordenacaoNomeAtiva = !this.ordenacaoNomeAtiva;

    if (this.ordenacaoNomeAtiva) {
      this.ordenacaoEmailAtiva = false;
    }

    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  ordenarPorEmail(): void {
    this.ordenacaoEmailAtiva = !this.ordenacaoEmailAtiva;

    if (this.ordenacaoEmailAtiva) {
      this.ordenacaoNomeAtiva = false;
    }

    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  agruparPorAtribuicao(): void {
    this.agrupamentoAtribuicaoAtivo = !this.agrupamentoAtribuicaoAtivo;
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  filtrarPorAtribuicao(): void {
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  limparFiltros(): void {
    this.termoBusca = '';
    this.ordenacaoNomeAtiva = false;
    this.ordenacaoEmailAtiva = false;
    this.agrupamentoAtribuicaoAtivo = false;
    this.atribuicaoSelecionada = '';
    this.menuFiltrosAberto = false;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    let lista = [...this.usuarios];

    const busca = this.termoBusca.trim().toLowerCase();

    if (busca) {
      lista = lista.filter((usuario) => {
        const nome = usuario.nome?.toLowerCase() || '';
        const email = usuario.email?.toLowerCase() || '';

        return nome.includes(busca) || email.includes(busca);
      });
    }

    if (this.atribuicaoSelecionada) {
      lista = lista.filter(
        (usuario) => usuario.atribuicao === this.atribuicaoSelecionada
      );
    }

    if (this.ordenacaoNomeAtiva) {
      lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    }

    if (this.ordenacaoEmailAtiva) {
      lista.sort((a, b) => a.email.localeCompare(b.email, 'pt-BR'));
    }

    if (this.agrupamentoAtribuicaoAtivo) {
      lista.sort((a, b) => {
        const comparacaoAtribuicao = this
          .textoAtribuicao(a.atribuicao)
          .localeCompare(this.textoAtribuicao(b.atribuicao), 'pt-BR');

        if (comparacaoAtribuicao !== 0) {
          return comparacaoAtribuicao;
        }

        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
    }

    this.usuariosFiltrados = lista;
  }

  abrirModalCriarUsuario(): void {
    this.modalAberto = true;
  }

  fecharModalCriarUsuario(): void {
    this.modalAberto = false;
    this.novoUsuario = this.criarUsuarioVazio();
  }

  abrirDetalhesUsuario(usuario: Usuario): void {
    if (!usuario.id) {
      this.exibirMensagem('Usuário sem ID', 'erro');
      return;
    }

    this.usuarioService.buscarPorId(usuario.id).subscribe({
      next: (usuarioAtualizado) => {
        this.usuarioDetalhe = usuarioAtualizado;
        this.modalDetalheAberto = true;
      },
      error: () => {
        this.exibirMensagem('Erro ao buscar detalhes do usuário', 'erro');
      },
    });
  }

  fecharModalDetalhe(): void {
    this.modalDetalheAberto = false;
    this.usuarioDetalhe = null;
  }

  abrirModalEditarUsuario(usuario: Usuario, event?: Event): void {
    event?.stopPropagation();

    this.usuarioEdicao = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      telefone: usuario.telefone,
      atribuicao: usuario.atribuicao,
      ativo: usuario.ativo ?? true,
      senha: usuario.senha,
    };

    this.modalDetalheAberto = false;
    this.modalEdicaoAberto = true;
  }

  fecharModalEditarUsuario(): void {
    this.modalEdicaoAberto = false;
    this.usuarioEdicao = this.criarUsuarioVazio();
  }

  carregarUsuarios(): void {
    this.usuarioService.listar().subscribe({
      next: (dados) => {
        this.usuarios = dados.filter((usuario) => usuario.ativo === true);
        this.aplicarFiltros();
        this.cdr.detectChanges();
      },
      error: () => {
        this.exibirMensagem('Erro ao carregar usuários', 'erro');
      },
    });
  }

  criarUsuario(): void {
    if (!this.validarUsuario(this.novoUsuario)) return;

    this.usuarioService.criar(this.novoUsuario).subscribe({
      next: () => {
        this.exibirMensagem('Usuário criado com sucesso!', 'sucesso');
        this.carregarUsuarios();
        this.novoUsuario = this.criarUsuarioVazio();
        this.modalAberto = false;
      },
      error: (erro) => {
        this.exibirMensagem(
          erro?.error?.message || 'Erro ao criar usuário',
          'erro'
        );
      },
    });
  }

  atualizarUsuario(): void {
    if (!this.usuarioEdicao.id) {
      this.exibirMensagem('Usuário sem ID', 'erro');
      return;
    }

    if (!this.validarUsuario(this.usuarioEdicao)) return;

    this.usuarioService
      .atualizar(this.usuarioEdicao.id, this.usuarioEdicao)
      .subscribe({
        next: () => {
          this.exibirMensagem('Usuário atualizado com sucesso!', 'sucesso');
          this.carregarUsuarios();
          this.modalEdicaoAberto = false;
          this.usuarioEdicao = this.criarUsuarioVazio();
        },
        error: (erro) => {
          this.exibirMensagem(
            erro?.error?.message || 'Erro ao atualizar usuário',
            'erro'
          );
        },
      });
  }

  excluirUsuarioDaTela(usuario: Usuario, event: Event): void {
    event.stopPropagation();

    if (!usuario.id) {
      this.exibirMensagem('Usuário sem ID', 'erro');
      return;
    }

    const confirmar = confirm(
      `Deseja remover ${usuario.nome} da listagem? O usuário continuará salvo no banco.`
    );

    if (!confirmar) return;

    this.usuarioService.excluirDaTela(usuario).subscribe({
      next: () => {
        this.exibirMensagem('Usuário removido da listagem!', 'sucesso');
        this.fecharModalDetalhe();
        this.carregarUsuarios();
      },
      error: () => {
        this.exibirMensagem('Erro ao remover usuário da listagem', 'erro');
      },
    });
  }

  iconeAtribuicao(atribuicao: Atribuicao | string): string {
    switch (atribuicao) {
      case Atribuicao.ADMINISTRADOR:
        return 'admin_panel_settings';
      case Atribuicao.EXECUTOR:
        return 'engineering';
      case Atribuicao.SOLICITANTE:
        return 'support_agent';
      default:
        return 'badge';
    }
  }

  textoAtribuicao(atribuicao: Atribuicao | string): string {
    switch (atribuicao) {
      case Atribuicao.ADMINISTRADOR:
        return 'Administrador';
      case Atribuicao.EXECUTOR:
        return 'Executor';
      case Atribuicao.SOLICITANTE:
        return 'Solicitante';
      default:
        return String(atribuicao);
    }
  }

  private criarUsuarioVazio(): Usuario {
    return {
      nome: '',
      email: '',
      telefone: '',
      atribuicao: Atribuicao.SOLICITANTE,
      ativo: true,
    };
  }

  private validarUsuario(usuario: Usuario): boolean {
    if (!usuario.nome?.trim()) {
      this.exibirMensagem('O nome é obrigatório', 'erro');
      return false;
    }

    if (!usuario.telefone?.trim()) {
      this.exibirMensagem('O telefone é obrigatório', 'erro');
      return false;
    }

    if (!usuario.email?.trim()) {
      this.exibirMensagem('O email é obrigatório', 'erro');
      return false;
    }

    if (!usuario.email.includes('@')) {
      this.exibirMensagem('Informe um email válido', 'erro');
      return false;
    }

    if (!usuario.atribuicao) {
      this.exibirMensagem('A atribuição é obrigatória', 'erro');
      return false;
    }

    return true;
  }

  private exibirMensagem(texto: string, tipo: 'sucesso' | 'erro'): void {
    this.mensagemSistema = texto;
    this.tipoMensagem = tipo;

    if (this.timeoutMensagem) {
      clearTimeout(this.timeoutMensagem);
    }

    this.timeoutMensagem = setTimeout(() => {
      this.mensagemSistema = '';
      this.cdr.detectChanges();
    }, 3000);
  }
}
