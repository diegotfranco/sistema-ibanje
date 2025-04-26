// src/services/produto.service.ts

import { ProdutoRepository } from "repositories/produto.repository";
import { ProdutoCreateDTO, ProdutoUpdateDTO } from "dtos/produto.dto";
import { Produto } from "types/produto";
import { Errors } from "errors/errorFactory";

export class ProdutoService {
  constructor(private readonly produtoRepo: ProdutoRepository) {}

  async listarTodos(): Promise<Produto[]> {
    return this.produtoRepo.findAll();
  }

  async buscarPorId(id: number): Promise<Produto> {
    const produto = await this.produtoRepo.findById(id);
    if (!produto) {
      throw Errors.notFound("Produto não encontrado");
    }
    return produto;
  }

  async criar(data: ProdutoCreateDTO): Promise<Produto> {
    // Here you could add validation later
    const parsed = ProdutoCreateDTO.safeParse(data);
    if (!parsed.success) {
      throw Errors.badRequest(
        parsed.error.errors.map((e) => e.message).join(", ")
      );
    }

    return this.produtoRepo.create(data);
  }

  async atualizar(id: number, data: ProdutoUpdateDTO): Promise<Produto> {
    const parsed = ProdutoUpdateDTO.safeParse(data);
    if (!parsed.success) {
      throw Errors.badRequest(parsed.error.errors.map((e) => e.message).join(", "));
    }
    const produto = await this.produtoRepo.update(id, parseddata);
    if (!produto) {
      throw Errors.notFound("Produto não encontrado");
    }
    return produto;
  }

  async deletar(id: number): Promise<void> {
    const success = await this.produtoRepo.delete(id);
    if (!success) {
      throw Errors.notFound("Produto não encontrado");
    }
  }
}
