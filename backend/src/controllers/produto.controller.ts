// src/controllers/produto.controller.ts

import { Request, Response } from "express";
import asyncHandler from "utils/asyncHandler";
import { ProdutoService } from "services/produto.service";
import { produtoRepository } from "repositories/produto.repository";

// Instantiate the service once
const produtoService = new ProdutoService(produtoRepository);

export const listarTodos = asyncHandler(
  async (_: Request, res: Response): Promise<void> => {
    const produtos = await produtoService.listarTodos();
    res.status(200).json(produtos);
  }
);

export const buscarPorId = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const produto = await produtoService.buscarPorId(Number(req.params.id));
    res.status(200).json(produto);
  }
);

export const criar = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const novo = await produtoService.criar(req.body);
    res.status(201).json(novo);
  }
);

export const atualizar = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    const produto = await produtoService.atualizar(
      Number(req.params.id),
      req.body
    );
    res.status(200).json(produto);
  }
);

export const deletar = asyncHandler(
  async (req: Request, res: Response): Promise<void> => {
    await produtoService.deletar(Number(req.params.id));
    res.sendStatus(204);
  }
);
