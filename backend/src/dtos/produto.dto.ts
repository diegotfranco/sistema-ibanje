import { z } from "zod";

export const ProdutoCreateDTO = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  preco: z.number().positive("Preço deve ser positivo"),
  estoque: z.number().int().nonnegative("Estoque não pode ser negativo"),
});

export const ProdutoUpdateDTO = ProdutoCreateDTO.partial();
