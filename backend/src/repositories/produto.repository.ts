// src/repositories/produto.repository.ts

import { sql } from "db/postgres";
import { Produto } from "types/produto";
import { ProdutoCreateDTO, ProdutoUpdateDTO } from "dtos/produto.dto";

export interface ProdutoRepository {
  findAll(): Promise<Produto[]>;
  findById(id: number): Promise<Produto | null>;
  create(data: ProdutoCreateDTO): Promise<Produto>;
  update(id: number, data: ProdutoUpdateDTO): Promise<Produto | null>;
  delete(id: number): Promise<boolean>;
}

// Postgres-specific implementation
export const produtoRepository: ProdutoRepository = {
  async findAll() {
    return await sql<Produto[]>`SELECT * FROM produtos ORDER BY id`;
  },

  async findById(id: number) {
    const [produto] = await sql<Produto[]>`
      SELECT * FROM produtos WHERE id = ${id}`;
    return produto || null;
  },

  async create(data) {
    const [novo] = await sql<Produto[]>`
      INSERT INTO produtos (nome, preco, estoque)
      VALUES (${data.nome}, ${data.preco}, ${data.estoque})
      RETURNING *`;
    return novo;
  },

  async update(id, data) {
    const [produto] = await sql<Produto[]>`
      UPDATE produtos SET
        nome = COALESCE(${data.nome}, nome),
        preco = COALESCE(${data.preco}, preco),
        estoque = COALESCE(${data.estoque}, estoque)
      WHERE id = ${id}
      RETURNING *`;
    return produto || null;
  },

  async delete(id) {
    const result = await sql`
      DELETE FROM produtos WHERE id = ${id}`;
    return result.count > 0;
  },
};
